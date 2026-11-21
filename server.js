const path = require("node:path");
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const { db } = require("./database");

const app = express();
const port = Number(process.env.PORT) || 3000;

if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  throw new Error("Set SESSION_SECRET before running in production.");
}

app.use(express.json({ limit: "20kb" }));
app.use(
  session({
    name: "little-grove.sid",
    secret:
      process.env.SESSION_SECRET ||
      "local-development-secret-change-before-deploying",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);
app.use(express.static(path.join(__dirname, "public")));

const productById = db.prepare(
  "SELECT id, name, description, category, price_cents AS priceCents, image FROM products WHERE id = ?",
);
const allProducts = db.prepare(`
  SELECT id, name, description, category, price_cents AS priceCents, image
  FROM products ORDER BY id
`);
const userByEmail = db.prepare(
  "SELECT id, full_name AS fullName, email, password_hash AS passwordHash FROM users WHERE email = ?",
);
const userById = db.prepare(
  "SELECT id, full_name AS fullName, email FROM users WHERE id = ?",
);
const publicUser = (userId) => userById.get(userId) || null;

function requireLogin(req, res, next) {
  if (!req.session.userId)
    return res.status(401).json({ error: "Please sign in to continue." });
  next();
}

function cartDetails(req) {
  const cart = req.session.cart || {};
  const items = Object.entries(cart).flatMap(([rawId, quantity]) => {
    const product = productById.get(Number(rawId));
    if (!product || quantity < 1) return [];
    return [
      { ...product, quantity, lineTotalCents: product.priceCents * quantity },
    ];
  });
  const totalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { items, totalCents, itemCount };
}

app.get("/api/products", (req, res) => {
  res.json({ products: allProducts.all() });
});

app.get("/api/auth/me", (req, res) => {
  res.json({
    user: req.session.userId ? publicUser(req.session.userId) : null,
  });
});

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const {
      fullName: rawFullName,
      email: rawEmail,
      password: rawPassword,
    } = req.body ?? {};
    const fullName = typeof rawFullName === "string" ? rawFullName.trim() : "";
    const email =
      typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    const password = typeof rawPassword === "string" ? rawPassword : "";
    if (fullName.length < 2 || fullName.length > 80) {
      return res
        .status(400)
        .json({ error: "Enter a name between 2 and 80 characters." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }
    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return res
        .status(400)
        .json({ error: "Choose a password between 8 and 72 characters." });
    }
    if (userByEmail.get(email)) {
      return res
        .status(409)
        .json({ error: "An account with that email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = db
      .prepare(
        "INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)",
      )
      .run(fullName, email, passwordHash);
    const userId = Number(result.lastInsertRowid);
    const guestCart = req.session.cart;
    req.session.regenerate((error) => {
      if (error) return next(error);
      req.session.userId = userId;
      if (guestCart) req.session.cart = guestCart;
      res.status(201).json({ user: publicUser(userId) });
    });
  } catch (error) {
    if (
      String(error.message).includes("UNIQUE constraint failed: users.email")
    ) {
      return res
        .status(409)
        .json({ error: "An account with that email already exists." });
    }
    next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const { email: rawEmail, password: rawPassword } = req.body ?? {};
    const email =
      typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    const password = typeof rawPassword === "string" ? rawPassword : "";
    const user = userByEmail.get(email);
    const passwordMatches =
      user && (await bcrypt.compare(password, user.passwordHash));
    if (!passwordMatches)
      return res.status(401).json({ error: "Email or password is incorrect." });
    const guestCart = req.session.cart;
    req.session.regenerate((error) => {
      if (error) return next(error);
      req.session.userId = user.id;
      if (guestCart) req.session.cart = guestCart;
      res.json({ user: publicUser(user.id) });
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/logout", (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie("little-grove.sid", { httpOnly: true, sameSite: "lax" });
    res.json({ message: "You are signed out." });
  });
});

app.get("/api/cart", (req, res) => res.json(cartDetails(req)));

app.post("/api/cart/items", (req, res) => {
  const { productId: rawProductId } = req.body ?? {};
  const productId = Number(rawProductId);
  if (!Number.isInteger(productId) || !productById.get(productId)) {
    return res
      .status(400)
      .json({ error: "Choose a product from the catalogue." });
  }
  const cart = req.session.cart || {};
  cart[productId] = Math.min((cart[productId] || 0) + 1, 99);
  req.session.cart = cart;
  res.json(cartDetails(req));
});

app.patch("/api/cart/items/:productId", (req, res) => {
  const productId = Number(req.params.productId);
  const { quantity } = req.body ?? {};
  if (!Number.isInteger(productId) || !productById.get(productId)) {
    return res
      .status(400)
      .json({ error: "Choose a product from the catalogue." });
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    return res
      .status(400)
      .json({ error: "Quantity must be a whole number from 1 to 99." });
  }
  const cart = req.session.cart || {};
  cart[productId] = quantity;
  req.session.cart = cart;
  res.json(cartDetails(req));
});

app.delete("/api/cart/items/:productId", (req, res) => {
  const productId = Number(req.params.productId);
  const cart = req.session.cart || {};
  delete cart[productId];
  req.session.cart = cart;
  res.json(cartDetails(req));
});

app.delete("/api/cart", (req, res) => {
  req.session.cart = {};
  res.json(cartDetails(req));
});

app.post("/api/checkout", requireLogin, (req, res, next) => {
  const { items, totalCents } = cartDetails(req);
  if (!items.length)
    return res.status(400).json({ error: "Your basket is empty." });

  try {
    db.exec("BEGIN");
    const order = db
      .prepare("INSERT INTO orders (user_id, total_cents) VALUES (?, ?)")
      .run(req.session.userId, totalCents);
    const orderId = Number(order.lastInsertRowid);
    const addOrderItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents)
      VALUES (?, ?, ?, ?)
    `);
    for (const item of items)
      addOrderItem.run(orderId, item.id, item.quantity, item.priceCents);
    db.exec("COMMIT");
    req.session.cart = {};
    res
      .status(201)
      .json({
        orderId,
        totalCents,
        message: "Your order is confirmed. Thanks for shopping with us.",
      });
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Could not roll back the failed order transaction.",
        rollbackError,
      );
    }
    next(error);
  }
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid request body." });
  }
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

app.listen(port, () => {
  console.log(`Little Grove Market is running at http://localhost:${port}`);
});
