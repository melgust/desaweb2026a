const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
const pool = mysql.createPool({
  host: process.env.DB_HOST || "172.20.10.2",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "mi_usuario",
  password: process.env.DB_PASSWORD || "mi_password",
  database: process.env.DB_NAME || "mi_base_datos",
  decimalNumbers: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.get("/products", async (req, res) => {
  try {
    const [products] = await pool.query(
      "SELECT id, name, price FROM products ORDER BY id"
    );
    res.json(products);
  } catch (error) {
    console.error("Error retrieving products:", error);
    res.status(500).json({ error: "Could not retrieve products" });
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const [products] = await pool.execute(
      "SELECT id, name, price FROM products WHERE id = ?",
      [req.params.id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(products[0]);
  } catch (error) {
    console.error("Error retrieving product:", error);
    res.status(500).json({ error: "Could not retrieve product" });
  }
});

async function startServer() {
  try {
    await pool.query("SELECT 1");
    app.listen(3001, "0.0.0.0", () => {
      console.log("Products API running on port 3001");
    });
  } catch (error) {
    console.error("Could not connect to MySQL:", error.message);
    process.exitCode = 1;
  }
}

startServer();
