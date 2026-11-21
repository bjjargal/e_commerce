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