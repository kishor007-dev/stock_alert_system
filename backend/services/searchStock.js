const axios = require("axios");

const cache = new Map();
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

async function searchStock(query) {
    console.log("SEARCH FUNCTION CALLED:", query);
    const key = query.toLowerCase();
    if (cache.has(key)) return cache.get(key);

    try {
        const url = `https://finnhub.io/api/v1/search?q=${query}&token=${FINNHUB_API_KEY}`;

        const res = await axios.get(url, { timeout: 8000 });

        const results = (res.data?.result || [])
            .slice(0, 10)
            .map(item => ({
                symbol: item.symbol,
                name: item.description
            }));

        cache.set(key, results);

        return results;

    } catch (err) {
        console.log("Finnhub search error:", err.message);
        return [];
    }
}


module.exports = { searchStock };