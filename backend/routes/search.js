const express = require("express");
const router = express.Router();
const { searchStocks } = require("../services/searchService");

// ==========================================
// GET /api/alerts/search
// Query parameters: ?q=RELI
// Zerodha-style autocomplete stock lookup
// ==========================================
router.get("/", async (req, res) => {
    try {
        const query = req.query.q;

        // Fail-safe validation: If input is empty or just whitespace, 
        // return an empty array immediately without hitting the database.
        if (!query || query.trim().length === 0) {
            return res.json([]);
        }

        // Pass cleaned query parameter to the service layer
        const results = await searchStocks(query.trim());
        
        // Ensure client always receives an array
        res.json(results || []);
    } catch (err) {
        // Log the actual trace on the server for debugging
        console.error("Search API Failure:", err);
        
        // Hide verbose internal database errors from the client
        res.status(500).json({ error: "Internal server error during instrument lookup" });
    }
});

module.exports = router;