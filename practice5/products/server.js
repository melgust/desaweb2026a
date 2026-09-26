const express = require("express");

const app = express();

app.get("/products", (req, res) => {
  res.json([
    { id: 1, name: "Laptop", price: 1200 },
    { id: 2, name: "Mouse", price: 25 }
  ]);
});

app.get("/products/:id", (req, res) => {
  res.json({
    id: Number(req.params.id),
    name: "Laptop",
    price: 1200
  });
});

app.listen(3002, "0.0.0.0", () => {
  console.log("Products API running on port 3002");
});
