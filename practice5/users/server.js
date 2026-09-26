const express = require("express");

const app = express();

app.get("/users", (req, res) => {
  res.json([
    { id: 1, name: "Ana" },
    { id: 2, name: "Carlos" }
  ]);
});

app.get("/users/:id", (req, res) => {
  res.json({
    id: Number(req.params.id),
    name: "Ana"
  });
});

app.listen(3001, "0.0.0.0", () => {
  console.log("Users API running on port 3001");
});
