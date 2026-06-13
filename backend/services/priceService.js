const axios = require("axios");

// 🇮🇳 UPSTOX PRICE
async function getUpstoxPrice(instrumentKey) {
    try {
        const res = await axios.get(
            `https://api.upstox.com/v2/market-quote/quotes?instrument_key=${instrumentKey}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}`
                }
            }
        );

        const data = res.data?.data;
        const key = Object.keys(data || {})[0];

        return data?.[key]?.last_price || null;

    } catch (err) {
        console.log("Upstox price error:", err.message);
        return null;
    }
}

// 🇺🇸 FINNHUB PRICE
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

// 🔥 UNIFIED
async function getStockPrice(alert) {

    if (alert.market === "india") {
        return await getUpstoxPrice(alert.instrumentKey);
    }

    return await getFinnhubPrice(alert.symbol);
}

module.exports = { getStockPrice };