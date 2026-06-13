const express = require("express");
const axios = require("axios");

const router = express.Router();

/**
 * Zerodha-style Yahoo search (stable + fast enough)
 */
router.get("/", async (req, res) => {
    try {
        const q = req.query.q;

        if (!q || q.length < 2) {
            return res.json([]);
        }

        const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0`;

        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0"
            },
            timeout: 5000
        });

        const quotes = response.data?.quotes || [];

        const results = quotes
            .filter(item => item.symbol)
            .map(item => ({
                symbol: item.symbol,
                name: item.shortname || item.longname || item.symbol
            }));

        return res.json(results);

    } catch (err) {
        console.error("Search error:", err.message);
        return res.json([]);
    }
});

module.exports = router;