const express = require("express");

const app = express();

app.get("/orders", (req, res) => {
  res.json([
    { id: 1, userId: 1, productId: 2, quantity: 2 },
    { id: 2, userId: 2, productId: 1, quantity: 1 }
  ]);
});

app.get("/orders/:id", (req, res) => {
  res.json({
    id: Number(req.params.id),
    userId: 1,
    productId: 2,
    quantity: 2
  });
});

app.listen(3003, "0.0.0.0", () => {
  console.log("Orders API running on port 3003");
});
