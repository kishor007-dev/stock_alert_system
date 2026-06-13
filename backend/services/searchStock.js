const axios = require("axios");

// simple local fallback (important)
const localStocks = [
    { symbol: "RELIANCE.NS", name: "Reliance Industries" },
    { symbol: "TCS.NS", name: "Tata Consultancy Services" },
    { symbol: "INFY.NS", name: "Infosys" },
    { symbol: "HDFCBANK.NS", name: "HDFC Bank" },
    { symbol: "ICICIBANK.NS", name: "ICICI Bank" },
];

const cache = new Map();
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

async function searchStock(query) {

    const key = query.toLowerCase();

    if (cache.has(key)) return cache.get(key);

    let results = [];

    try {
        // ======================
        // FINNHUB (US + global)
        // ======================
        const url = `https://finnhub.io/api/v1/search?q=${query}&token=${FINNHUB_API_KEY}`;

        const res = await axios.get(url, { timeout: 5000 });

        const finnhubResults = (res.data?.result || []).map(r => ({
            symbol: r.symbol,
            name: r.description
        }));

        results = [...finnhubResults];

    } catch (err) {
        console.log("Finnhub search error:", err.message);
    }

    // ======================
    // LOCAL NSE FALLBACK
    // ======================
    const local = localStocks.filter(s =>
        s.symbol.toLowerCase().includes(query.toLowerCase()) ||
        s.name.toLowerCase().includes(query.toLowerCase())
    );

    results = [...results, ...local];

    cache.set(key, results.slice(0, 10));

    return results.slice(0, 10);
}

module.exports = { searchStock };