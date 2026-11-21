# Little Grove Market

Little Grove Market is a small e-commerce application for the Web Development CA-2 brief. It demonstrates HTML, CSS and browser JavaScript with a Node.js/Express server and an SQLite database. It supports account registration and login, a database-backed catalogue, a session basket, and a simulated checkout that records an order.

## Run the application

Use Node.js 22.13 or newer. The project uses Node's built-in SQLite module. From this folder:

```sh
npm install
npm start
```

For development with automatic server restarts, use `npm run dev`.

Open [http://localhost:3000](http://localhost:3000). The SQLite database is created in `data/little-grove.sqlite` the first time the server starts. Five sample products are inserted automatically. To change the port or session secret, copy `.env.example` to `.env` and edit the values; `dotenv` loads that file when the server starts.

For a local demonstration, the server has a fallback session secret. Before deploying anywhere, set a long random `SESSION_SECRET` and `NODE_ENV=production`. This coursework demo uses Express's in-memory session store; it is intended for a local demonstration, not a public production service.

## Pages and features

- `public/index.html` displays the catalogue and basket.
- `public/register.html` and `public/login.html` provide account forms.
- `public/checkout.html` reviews the basket and submits a simulated order.
- `public/js/` contains browser code that calls the JSON API.
- `server.js` defines the Express API, validation, sessions and checkout flow.
- `database.js` creates the SQLite tables and inserts the five starter products with `node:sqlite`.
- `public/images/` contains original SVG product illustrations made for this project.

Passwords are hashed with bcrypt before insertion. The browser never receives a password hash. Product and order data are stored in SQLite. Basket quantities are kept in the Express session until checkout. The checkout transaction stores the order and its item rows, then clears the basket. No payment details are collected.

## Data model

| Table | Purpose | Main relationship |
| --- | --- | --- |
| `users` | Account name, email and password hash | One user can place many orders |
| `products` | Name, description, category, price and image path | Products can appear in many order items |
| `orders` | Owner and order total | Belongs to one user |
| `order_items` | Product, quantity and saved unit price | Belongs to one order and one product |

Prices are stored as integer cents to avoid floating point rounding in totals. The frontend formats those integer amounts as euros for display.

## Request flow to explain

1. The browser downloads the static HTML, CSS and JavaScript from Express.
2. `shop.js` requests `GET /api/products`; Express reads the `products` table and returns JSON.
3. When a shopper adds or removes an item, browser JavaScript calls the cart API. The product ID and quantity are stored in the server session cookie's session record, while product details and prices are looked up in SQLite.
4. Registration validates the input, hashes the password with bcrypt, inserts the new user, and starts a session. Login finds the account by email and compares the submitted password to the stored hash.
5. Checkout requires a signed-in session. Express calculates the total from the current database prices, inserts an order and its line items, and empties the session basket.

## Six-minute video outline

Use your own voice in the MP4. Keep the screen recording within six minutes and show both the working site and the source code.

| Time | Show and explain |
| --- | --- |
| 0:00–0:30 | Introduce Little Grove Market and the stack: HTML, CSS, JavaScript, Express and SQLite. |
| 0:30–1:00 | Register a demo account. Point out the required name, email and password validation. Do not show a real password. |
| 1:00–1:30 | Sign in, browse the five products and add two items. Show the basket total and remove one item. |
| 1:30–2:00 | Open checkout, place the simulated order and show the confirmation and order reference. |
| 2:00–2:45 | In `public/index.html` and `public/styles.css`, explain the semantic page structure, responsive layout and product card styling. |
| 2:45–3:30 | In `public/js/shop.js`, trace `fetch`/`request`, rendering the product JSON and adding or removing basket items. |
| 3:30–4:15 | In `server.js`, show an Express route, JSON response, validation and the login/session flow. Explain how bcrypt compares passwords. |
| 4:15–5:15 | In `database.js`, show the tables and starter product insert. Open the SQLite database and point out users, products, orders and order items. |
| 5:15–6:00 | Explain that checkout inserts an order and its line items in one transaction, clears the basket, and does not take payment. Summarise one limitation and how you would improve it. |

## Q&A practice

- **Why hash passwords?** The database stores a one-way bcrypt hash. Login compares the submitted password to that hash instead of storing or returning the plain password.
- **How does the catalogue reach the page?** Browser JavaScript sends `GET /api/products`. Express queries SQLite and returns product rows as JSON; JavaScript creates the cards.
- **Where is the basket stored?** Product IDs and quantities are held in the server-side session. Each request looks up current product details and prices from SQLite.
- **How is the total calculated?** The server multiplies the database price in cents by each quantity and adds the line totals. The browser only formats the result as euros.
- **What is persisted at checkout?** One row is inserted into `orders`, then a row per product is inserted into `order_items`. The basket is cleared after the transaction succeeds.
- **What is outside this demo's scope?** Real payment processing, email verification, production session storage and a deployed hosting environment.

## Before submission

- Replace any course, student or personal details if your lecturer expects them in a cover page or presentation.
- Use the official CCT assessment cover page from Moodle.
- Add the required AI-use Word document with your exact prompts, relevant outputs and your own reflection on what you checked, accepted or changed.
- The local Git history currently has ten logical commits authored by OpenAI Codex. Review them before publishing and add commits for your own changes; do not present generated work as independent work.
- Create your own GitHub repository, publish the project history, and provide access to `tahmed1986` as the brief directs. Do not publish secrets or a real user database.
- Zip the website folder for Moodle. Save the voice-over MP4 in your Drive and submit an accessible link, as directed by the brief.
