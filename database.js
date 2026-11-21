const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');

const dataDirectory = path.join(__dirname, 'data');
const databasePath = path.join(dataDirectory, 'little-grove.sqlite');
let db;

try {
  fs.mkdirSync(dataDirectory, { recursive: true });
  db = new DatabaseSync(databasePath);
  db.exec('PRAGMA foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
      image TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      total_cents INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price_cents INTEGER NOT NULL
    );
  `);

  const starterProducts = [
    ['Moss Ceramic Mug', 'A sturdy stoneware mug with a soft sage glaze for slow mornings.', 'Kitchen', 1800, '/images/mug.svg'],
    ['Field Notes Journal', 'A cloth-bound notebook with 160 recycled pages for everyday ideas.', 'Stationery', 1450, '/images/journal.svg'],
    ['Everyday Market Tote', 'A roomy, natural cotton tote made for the library, market and beyond.', 'Accessories', 2200, '/images/tote.svg'],
    ['Cedar & Fig Candle', 'A small-batch soy candle with warm cedar, fig and a clean cotton wick.', 'Home', 2600, '/images/candle.svg'],
    ['Little Fern Planter', 'A matte ceramic planter that brings an easy touch of green to a desk.', 'Home', 1950, '/images/planter.svg']
  ];
  const addProduct = db.prepare(`
    INSERT OR IGNORE INTO products (id, name, description, category, price_cents, image)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  starterProducts.forEach((product, index) => addProduct.run(index + 1, ...product));
} catch (error) {
  console.error(`Could not initialize the SQLite database at ${databasePath}. Check that the project folder is writable.`, error);
  if (db) {
    try {
      db.close();
    } catch (closeError) {
      console.error('Could not close the partially initialized SQLite database.', closeError);
    }
  }
  throw error;
}

module.exports = { db };
