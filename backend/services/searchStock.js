const stocks = require("../data/stocks");

// simple cache for speed
const cache = new Map();

// fuzzy score function (Zerodha-style ranking)
function scoreMatch(query, text) {
    query = query.toLowerCase();
    text = text.toLowerCase();

    if (text === query) return 100;
    if (text.startsWith(query)) return 90;
    if (text.includes(query)) return 70;

    // fuzzy fallback
    let score = 0;
    let qi = 0;

    for (let i = 0; i < text.length && qi < query.length; i++) {
        if (text[i] === query[qi]) {
            score += 1;
            qi++;
        }
    }

    return qi === query.length ? score : 0;
}

function searchStock(query) {
    if (!query) return [];

    const key = query.toLowerCase();

    if (cache.has(key)) return cache.get(key);

    const results = stocks
        .map(stock => {
            const symbolScore = scoreMatch(query, stock.symbol);
            const nameScore = scoreMatch(query, stock.name);

            return {
                ...stock,
                score: Math.max(symbolScore, nameScore)
            };
        })
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(({ symbol, name }) => ({ symbol, name }));

    cache.set(key, results);

    return results;
}

module.exports = { searchStock };