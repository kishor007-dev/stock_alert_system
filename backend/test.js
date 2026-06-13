const express = require("express");
const { getUpstoxPrice } = require("./services/upstoxPrice");

const app = express();

// TEST ROUTE
app.get("/test", async (req, res) => {
    try {
        const price = await getUpstoxPrice("NSE_EQ|INE002A01018");
        res.json({ price });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// START SERVER
const PORT = 4000;

app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
});