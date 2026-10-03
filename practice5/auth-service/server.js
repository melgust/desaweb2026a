const express = require("express");

const app = express();

const VALID_TOKEN = "abc123";

app.get("/validate", (req, res) => {
    const auth = req.headers.authorization;

    if (!auth) {
        return res.status(401).json({
            authenticated: false
        });
    }

    const token = auth.replace("Bearer ", "");

    if (token !== VALID_TOKEN) {
        return res.status(401).json({
            authenticated: false
        });
    }

    res.status(200).json({
        authenticated: true,
        user: "demo-user"
    });
});

app.listen(4000, () => {
    console.log("Auth service running on port 4000");
});
