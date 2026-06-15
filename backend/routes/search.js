const express = require("express");
const router = express.Router();
const { searchStocks } = require("../services/searchService");

router.get("/", async (req, res) => {
    try {
        const q = req.query.q;
        const results = await searchStocks(q);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;