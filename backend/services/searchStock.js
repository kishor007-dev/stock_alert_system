const axios = require("axios");

const cache = new Map();

// 🇮🇳 Local NSE database (expand later)
const nseStocks = [
    { symbol: "RELIANCE.NS", name: "Reliance Industries" },
    { symbol: "TCS.NS", name: "Tata Consultancy Services" },
    { symbol: "INFY.NS", name: "Infosys" },
    { symbol: "HDFCBANK.NS", name: "HDFC Bank" },
    { symbol: "ICICIBANK.NS", name: "ICICI Bank" },
];

// 🔍 SEARCH FUNCTION
async function searchStock(query) {

    const key = query.toLowerCase();
    if (cache.has(key)) return cache.get(key);

    let results = [];

    // 🇮🇳 LOCAL SEARCH (FAST + RELIABLE)
    const india = nseStocks.filter(s =>
        s.symbol.toLowerCase().includes(key) ||
        s.name.toLowerCase().includes(key)
    );

    results.push(...india);

    // 🇺🇸 FINNHUB SEARCH (US ONLY)
    try {
        const us = await axios.get(
            `https://finnhub.io/api/v1/search?q=${query}&token=${process.env.FINNHUB_API_KEY}`
        );

        const usa = (us.data?.result || []).map(r => ({
            symbol: r.symbol,
            name: r.description
        }));

        results.push(...usa);

    } catch (err) {
        console.log("Finnhub search error:", err.message);
    }

    const final = results.slice(0, 10);
    cache.set(key, final);

    return final;
}

module.exports = { searchStock };