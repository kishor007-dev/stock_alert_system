
// const axios = require('axios');
// const admin = require('firebase-admin');
// const Alert = require('./models/alert');

// const processAlerts = async () => {
//     console.log(`[Worker] Running stock check at ${new Date().toISOString()}`);
//     try {
//         const activeAlerts = await Alert.find({ triggered: false });
//         if (activeAlerts.length === 0) return;

//         const symbolMap = {}; 
//         activeAlerts.forEach(a => {
//             if (!symbolMap[a.symbol]) symbolMap[a.symbol] = [];
//             symbolMap[a.symbol].push(a);
//         });

//         const now = new Date();

//         for (const symbol of Object.keys(symbolMap)) {
//             try {
//                 const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
//                 const meta = response.data.chart.result[0].meta;
//                 const currentPrice = meta.regularMarketPrice;
//                 const currency = meta.currency || 'USD';

//                 for (const alert of symbolMap[symbol]) {
//                     let shouldNotify = false;
//                     let title = '📈 Stock Alert!';
//                     let body = '';

//                     // 1. Evaluate Condition Alert
//                     if (alert.alertType === 'condition') {
//                         if (alert.condition === '>' && currentPrice > alert.targetPrice) shouldNotify = true;
//                         if (alert.condition === '<' && currentPrice < alert.targetPrice) shouldNotify = true;
//                         title = '📈 Target Reached!';
//                         body = `${symbol} hit ${currentPrice} ${currency} (Target: ${alert.condition} ${alert.targetPrice})`;
//                     } 
//                     // 2. Evaluate Interval Alert
//                     else if (alert.alertType === 'interval') {
//                         if (!alert.lastTriggeredAt) {
//                             shouldNotify = true;
//                         } else {
//                             const diffMinutes = (now.getTime() - new Date(alert.lastTriggeredAt).getTime()) / 60000;
//                             if (diffMinutes >= alert.intervalMinutes) shouldNotify = true;
//                         }
//                         title = `⏱️ ${alert.intervalMinutes}-Min Update: ${symbol}`;
//                         body = `Current Price: ${currentPrice} ${currency}`;
//                         console.log(body)
//                     }

//                     if (shouldNotify) {
//                         try {
//                             await admin.messaging().send({
//                                 notification: { title, body },
//                                 webpush: {
//                                     notification: {
//                                         icon: 'https://cdn-icons-png.flaticon.com/512/2933/2933116.png'
//                                     }
//                                 },
//                                 token: alert.deviceToken
//                             });
//                             console.log(`✅ Sent notification for ${symbol}`);
                            
//                             if (alert.alertType === 'condition') {
//                                 alert.triggered = true;
//                             } else {
//                                 alert.lastTriggeredAt = now;
//                             }
//                             await alert.save();
//                         } catch (fcmErr) {
//                             console.error(`❌ FCM Error for ${symbol}:`, fcmErr.message);
//                             // Auto-delete bad tokens to prevent crash loops
//                             if (fcmErr.code === 'messaging/registration-token-not-registered' || fcmErr.message.includes('entity was not found')) {
//                                 console.log(`🗑️ Deleting dead alert ID: ${alert._id}`);
//                                 await Alert.findByIdAndDelete(alert._id);
//                             }
//                         }
//                     }
//                 }
//             } catch (err) {
//                 console.error(`❌ Yahoo API Error for ${symbol}:`, err.message);
//             }
//         }
//     } catch (error) {
//         console.error("❌ Worker Error:", error);
//     }
// };

// const startWorker = () => {
//     setInterval(processAlerts, 60000); // Check every 60 seconds
//     processAlerts(); 
// };

// module.exports = { startWorker };
const axios = require("axios");
const admin = require("firebase-admin");
const Alert = require("./models/alert");
const NodeCache = require("node-cache");

const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance({
    suppressNotices:["yahooSurvey"]
});

const cache = new NodeCache({ stdTTL: 60 });

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// sleep helper
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// =========================
// FINNHUB (US STOCKS)
// =========================
async function getFinnhubPrice(symbol) {
    try {
        const url =
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;

        const res = await axios.get(url, {
            timeout: 8000
        });

        const price = res.data?.c;

        if (price == null) return null;

        return Number(price);

    } catch (err) {
        console.error(`❌ Finnhub error ${symbol}:`, err.message);
        return null;
    }
}

// =========================
// YAHOO (INDIAN STOCKS)
// =========================
async function getYahooPrice(symbol) {
    try {

        const quote = await yahooFinance.quote(symbol);

        const price = quote?.regularMarketPrice;

        if (price == null) {
            console.log(`❌ No Yahoo price for ${symbol}`);
            return null;
        }

        return Number(price);

    } catch (err) {
        console.error(`❌ Yahoo error ${symbol}:`, err.message);
        return null;
    }
}

// =========================
// HYBRID PRICE FETCHER
// =========================
async function getStockPrice(symbol) {

    const cached = cache.get(symbol);

    if (cached) {
        return cached;
    }

    let price = null;

    // Indian Stocks
    if (
        symbol.endsWith(".NS") ||
        symbol.endsWith(".BO")
    ) {

        console.log(`📈 Yahoo -> ${symbol}`);

        price = await getYahooPrice(symbol);
    }

    // US Stocks
    else {

        console.log(`📈 Finnhub -> ${symbol}`);

        price = await getFinnhubPrice(symbol);

        // fallback
        if (price == null) {
            console.log(`⚠️ Finnhub failed. Trying Yahoo -> ${symbol}`);
            price = await getYahooPrice(symbol);
        }
    }

    if (price != null) {
        cache.set(symbol, price);
    }

    return price;
}

// =========================
// WORKER
// =========================
const processAlerts = async () => {
    console.log(`[Worker] Running at ${new Date().toISOString()}`);

    try {
        const alerts = await Alert.find({ triggered: false });

        if (!alerts.length) return;

        const grouped = {};

        for (const a of alerts) {
            if (!grouped[a.symbol]) grouped[a.symbol] = [];
            grouped[a.symbol].push(a);
        }

        const now = Date.now();

        for (const symbol of Object.keys(grouped)) {

            await sleep(800); // prevent rate limit

            const price = await getStockPrice(symbol);
            if (!price) continue;

            for (const alert of grouped[symbol]) {

                let shouldSend = false;
                let title = "Stock Alert";
                let body = "";

                // CONDITION ALERT
                if (alert.alertType === "condition") {
                    if (alert.condition === ">" && price > alert.targetPrice) shouldSend = true;
                    if (alert.condition === "<" && price < alert.targetPrice) shouldSend = true;

                    title = "🎯 Target Hit";
                    body = `${symbol} is ${price}`;
                }

                // INTERVAL ALERT
                else if (alert.alertType === "interval") {
                    if (!alert.lastTriggeredAt) {
                        shouldSend = true;
                    } else {
                        const diff = (now - new Date(alert.lastTriggeredAt).getTime()) / 60000;
                        if (diff >= alert.intervalMinutes) shouldSend = true;
                    }

                    title = `⏱ ${alert.intervalMinutes} min update`;
                    body = `${symbol}: ${price}`;
                }

                if (shouldSend) {
                    try {
                        await admin.messaging().send({
                            token: alert.deviceToken,
                            notification: { title, body }
                        });

                        console.log(`✅ Sent ${symbol}`);

                        if (alert.alertType === "condition") {
                            alert.triggered = true;
                        } else {
                            alert.lastTriggeredAt = new Date();
                        }

                        await alert.save();

                    } catch (err) {
                        console.error("FCM Error:", err.message);

                        if (err.code === "messaging/registration-token-not-registered") {
                            await Alert.findByIdAndDelete(alert._id);
                        }
                    }
                }
            }
        }

    } catch (err) {
        console.error("Worker Error:", err.message);
    }
};

// =========================
// START
// =========================
let isRunning = false;

const safeProcessAlerts = async () => {
    if (isRunning) return;

    isRunning = true;

    try {
        await processAlerts();
    } finally {
        isRunning = false;
    }
};

const startWorker = () => {
    setInterval(safeProcessAlerts, 60 * 1000);
    safeProcessAlerts();
};

module.exports = { startWorker };