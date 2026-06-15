const axios = require("axios");

async function getUpstoxPrice(instrumentKey) {
    try {
        const res = await axios.get(
            `https://api.upstox.com/v2/market-quote/ltp?instrument_key=${instrumentKey}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}`
                }
            }
        );

        const data = res.data?.data;
        const key = Object.keys(data)[0];

        return data[key]?.last_price || null;
    } catch (err) {
        return null;
    }
}

async function getFinnhubPrice(symbol) {
    try {
        const res = await axios.get(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`
        );

        return res.data?.c || null; // current price
    } catch (err) {
        return null;
    }
}

module.exports = { getUpstoxPrice, getFinnhubPrice };