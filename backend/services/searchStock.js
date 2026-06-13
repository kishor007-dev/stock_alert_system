const axios = require("axios");
const cache = new Map();

async function searchStock(query) {
    const key = query.toLowerCase();

    if (cache.has(key)) return cache.get(key);

    try {
        const res = await axios.get(
            `https://symbol-search.tradingview.com/symbol_search/?text=${query}&hl=1&exchange=`
        );

        const data = (res.data || []).slice(0, 10).map(item => ({
            symbol: item.symbol,
            name: item.description
        }));

        cache.set(key, data);
        return data;

    } catch (err) {
        console.log("Search error:", err.message);
        return [];
    }
}

module.exports = { searchStock };