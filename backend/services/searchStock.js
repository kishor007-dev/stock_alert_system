const axios = require("axios");

const cache = new Map();

async function searchStock(query) {

    const key = query.toLowerCase();
    if (cache.has(key)) return cache.get(key);

    try {
        const res = await axios.get(
            `https://www.nseindia.com/api/search/autocomplete?q=${query}`,
            {
                headers: {
                    "User-Agent": "Mozilla/5.0",
                    "Accept": "*/*",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Referer": "https://www.nseindia.com"
                },
                timeout: 8000
            }
        );

        const data = res.data?.symbols || [];

        const results = data.slice(0, 5).map(item => ({
            symbol: item.symbol,
            name: item.display
        }));

        cache.set(key, results);

        return results;

    } catch (err) {
        console.log("NSE search error:", err.message);
        return [];
    }
}

module.exports = { searchStock };