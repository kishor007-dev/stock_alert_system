const axios = require("axios");
const { getUpstoxPrice } = require("./upstoxPrice");

// =========================
// 🇺🇸 FINNHUB
// =========================
async function getFinnhubPrice(symbol) {
    try {
        const res = await axios.get(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`
        );

        return res.data?.c || null;
    } catch (err) {
        console.log("Finnhub error:", err.message);
        return null;
    }
}

// =========================
// 🌍 MAIN ROUTER
// =========================
async function getPrice(alert) {

    // 🇮🇳 INDIA → Upstox
    if (alert.symbol?.endsWith(".NS") || alert.symbol?.endsWith(".BO")) {
        return await getUpstoxPrice(alert.symbol);
    }

    // 🇺🇸 US → Finnhub
    return await getFinnhubPrice(alert.symbol);
}

module.exports = { getPrice };