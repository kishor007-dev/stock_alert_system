// const axios = require("axios");

// // =========================
// // 🇮🇳 UPSTOX SEARCH (INDIA)
// // =========================
// async function resolveIndianStock(query) {
//     try {
//         const res = await axios.get(
//             `https://api.upstox.com/v2/search/instruments?query=${query}`,
//             {
//                 headers: {
//                     Authorization: `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}`
//                 }
//             }
//         );

//         const data = res.data?.data || [];

//         // return best match
//         return data[0] || null;

//     } catch (err) {
//         console.log("Upstox search error:", err.message);
//         return null;
//     }
// }

// // =========================
// // 🌍 MAIN RESOLVER
// // =========================
// async function resolveStock(symbol) {

//     // 🇮🇳 India stocks (.NS / .BO OR raw name)
//     if (symbol.endsWith(".NS") || symbol.endsWith(".BO") || !symbol.includes(" ")) {

//         const clean = symbol.replace(".NS", "").replace(".BO", "");

//         const result = await resolveIndianStock(clean);

//         if (result) {
//             return {
//                 market: "india",
//                 symbol: result.trading_symbol,
//                 instrumentKey: result.instrument_key
//             };
//         }

//         return null;
//     }

//     // 🇺🇸 US stocks → direct
//     return {
//         market: "us",
//         symbol
//     };
// }

// module.exports = { resolveStock };
const axios = require("axios");

// 🇮🇳 UPSTOX RESOLVE
async function resolveIndianStock(query) {
    try {
        const res = await axios.get(
            `https://api.upstox.com/v2/search/instruments?query=${query}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}`
                }
            }
        );

        const data = res.data?.data || [];
        if (!data.length) return null;

        const best = data[0];

        return {
            market: "india",
            symbol: best.trading_symbol,
            instrumentKey: best.instrument_key
        };

    } catch (err) {
        console.log("Upstox search error:", err.message);
        return null;
    }
}

// 🌍 MAIN RESOLVER
async function resolveStock(symbol) {

    const clean = symbol.replace(".NS", "").replace(".BO", "");

    // India detection
    if (symbol.includes(".NS") || symbol.includes(".BO")) {
        return await resolveIndianStock(clean);
    }

    // US stock (no instrumentKey)
    return {
        market: "us",
        symbol
    };
}

module.exports = { resolveStock };