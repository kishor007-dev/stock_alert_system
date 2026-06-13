const axios = require("axios");
const { getUpstoxPrice } = require("./upstoxPrice");

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// =========================
// 🇺🇸 US STOCKS (FINNHUB)
// =========================
async function getFinnhubPrice(symbol) {
    try {
        const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;

        const res = await axios.get(url, { timeout: 8000 });

        return res.data?.c || null;
    } catch (err) {
        console.log("Finnhub error:", err.message);
        return null;
    }
}

// =========================
// 🇮🇳 INDIA STOCKS (UPSTOX)
// =========================
async function getIndianPrice(instrumentKey) {
    return await getUpstoxPrice(instrumentKey);
}

// =========================
// 🌍 HYBRID ROUTER
// =========================
async function getStockPrice(alert) {
    try {
        // INDIA → Upstox
        if (alert.instrumentKey) {
            console.log("🇮🇳 Upstox:", alert.instrumentKey);
            return await getIndianPrice(alert.instrumentKey);
        }

        // USA → Finnhub
        if (alert.symbol) {
            console.log("🇺🇸 Finnhub:", alert.symbol);
            return await getFinnhubPrice(alert.symbol);
        }

        return null;
    } catch (err) {
        console.log("Price service error:", err.message);
        return null;
    }
}

module.exports = { getStockPrice };