const express = require("express");
const router = express.Router();
const { searchStock } = require("../services/searchStock");

// ✅ SEARCH ROUTE
router.get("/", async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) return res.json([]);

        const results = await searchStock(q);

        return res.json(results);

    } catch (err) {
        console.error("Search error:", err.message);
        return res.json([]);
    }
});

// ⚠️ IMPORTANT: export ONLY router
module.exports = router;