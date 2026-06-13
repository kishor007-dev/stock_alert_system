const axios = require("axios");

const cache = new Map();
const CACHE_TTL = 1000 * 60 * 10; // 10 min

async function searchStock(query) {

    const key = query.toLowerCase();

    // =====================
    // CACHE HIT
    // =====================
    const cached = cache.get(key);
    if (cached && (Date.now() - cached.time < CACHE_TTL)) {
        return cached.data;
    }

    try {
        const res = await axios.get(
            `https://query1.finance.yahoo.com/v1/finance/search?q=${query}`,
            {
                timeout: 5000,
                headers: {
                    "User-Agent": "Mozilla/5.0"
                }
            }
        );

        const result = (res.data?.quotes || []).slice(0, 5);

        cache.set(key, {
            data: result,
            time: Date.now()
        });

        return result;

    } catch (err) {
        console.log("Yahoo search error:", err.message);

        // =====================
        // FALLBACK (IMPORTANT)
        // =====================
        return cache.get(key)?.data || [];
    }
}

module.exports = { searchStock };