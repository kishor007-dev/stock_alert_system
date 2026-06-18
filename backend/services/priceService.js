const axios = require("axios");
const NodeCache = require("node-cache");

// Set cache Time-To-Live (TTL) to 10 seconds. 
// This guarantees that even if 10,000 alerts trigger for 'AAPL' in a single worker cycle, 
// Finnhub is only pinged exactly once.
const priceCache = new NodeCache({ stdTTL: 10, checkperiod: 15 });

// ==========================================
// 🇮🇳 UPSTOX PRICE FETCH
// ==========================================
async function getUpstoxPrice(instrumentKey) {
    const res = await axios.get(
        `https://api.upstox.com/v2/market-quote/quotes?instrument_key=${instrumentKey}`,
        {
            headers: {
                Authorization: `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}`,
                Accept: "application/json"
            }
        }
    );

    const data = res.data?.data;
    if (!data) throw new Error("Upstox returned an empty or malformed payload");

    // Upstox returns dynamic keys based on the requested instrument
    const key = Object.keys(data)[0];
    const price = data[key]?.last_price;

    if (price === undefined || price === null) {
        throw new Error(`Upstox price missing for instrument: ${instrumentKey}`);
    }

    return price;
}

// ==========================================
// 🇺🇸 FINNHUB PRICE FETCH
// ==========================================
async function getFinnhubPrice(symbol) {
    const res = await axios.get(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`
    );

    const price = res.data?.c; // 'c' stands for current price in Finnhub

    if (price === undefined || price === null || price === 0) {
        throw new Error(`Finnhub price missing for symbol: ${symbol}`);
    }

    return price;
}

// ==========================================
// 🔥 UNIFIED CACHED DISPATCHER
// ==========================================
async function getLivePrice(instrument) {
    // 1. Check cache first to avoid rate limits
    const cacheKey = `price_${instrument.symbol}`;
    const cachedPrice = priceCache.get(cacheKey);
    
    if (cachedPrice) {
        return cachedPrice;
    }

    let livePrice;

    // 2. Route to the correct provider using strict schema enums
    if (instrument.region === 'IN') {
        if (!instrument.instrumentKey) {
            throw new Error(`Missing instrumentKey for Indian stock: ${instrument.symbol}`);
        }
        livePrice = await getUpstoxPrice(instrument.instrumentKey);
        
    } else if (instrument.region === 'US') {
        livePrice = await getFinnhubPrice(instrument.symbol);
        
    } else {
        throw new Error(`System exception: Unsupported region ${instrument.region}`);
    }

    // 3. Cache the successful result before returning
    priceCache.set(cacheKey, livePrice);
    return livePrice;
}

module.exports = { getLivePrice };