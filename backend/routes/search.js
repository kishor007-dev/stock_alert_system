const express = require("express");
const router = express.Router();
const { searchStock } = require("../services/searchStock");

router.get("/", (req, res) => {
    const { q } = req.query;

    const results = searchStock(q);

    res.json(results);
});

module.exports = router;