const axios = require("axios");

// cache
const cache = new Map();

async function searchStock(query) {
    const key = query.toLowerCase();
    if (cache.has(key)) return cache.get(key);

    let results = [];

    try {
        // 🇮🇳 1. UPSTOX (India search)
        const upstox = await axios.get(
            `https://api.upstox.com/v2/search/instruments?query=${query}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}`
                }
            }
        );

        const india = (upstox.data?.data || []).slice(0, 5).map(i => ({
            symbol: i.trading_symbol,
            name: i.name || i.trading_symbol
        }));

        results.push(...india);

    } catch (err) {
        console.log("Upstox search failed:", err.message);
    }

    try {
        // 🇺🇸 2. FINNHUB (US search)
        const us = await axios.get(
            `https://finnhub.io/api/v1/search?q=${query}&token=${process.env.FINNHUB_API_KEY}`
        );

        const usa = (us.data?.result || []).slice(0, 5).map(i => ({
            symbol: i.symbol,
            name: i.description
        }));

        results.push(...usa);

    } catch (err) {
        console.log("Finnhub search failed:", err.message);
    }

    const final = results.slice(0, 10);

    cache.set(key, final);
    return final;
}

module.exports = { searchStock };