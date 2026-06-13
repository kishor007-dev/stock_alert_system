const axios = require("axios");

async function searchStock(query) {
    try {
        const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${query}`;

        const res = await axios.get(url);

        const quotes = res.data?.quotes || [];

        return quotes.slice(0, 5).map(q => ({
            symbol: q.symbol,
            name: q.shortname || q.longname
        }));

    } catch (err) {
        console.log("Yahoo search error:", err.message);
        return [];
    }
}

module.exports = { searchStock };
