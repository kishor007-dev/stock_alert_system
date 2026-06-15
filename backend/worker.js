
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
// const axios = require("axios");
// const admin = require("firebase-admin");
// const Alert = require("./models/alert");
// const NodeCache = require("node-cache");

// const cache = new NodeCache({ stdTTL: 60 });

// // =========================
// // UPSTOX PRICE (INDIA)
// // =========================
// async function getUpstoxPrice(instrumentKey) {
//     try {
//         const res = await axios.get(
//             `https://api.upstox.com/v2/market-quote/ltp?instrument_key=${instrumentKey}`,
//             {
//                 headers: {
//                     Authorization: `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}`
//                 }
//             }
//         );

//         return res.data?.data?.[instrumentKey]?.last_price || null;

//     } catch (err) {
//         console.log("Upstox price error:", err.message);
//         return null;
//     }
// }

// // =========================
// // YAHOO PRICE (US fallback)
// // =========================
// async function getYahooPrice(symbol) {
//     try {
//         const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;

//         const res = await axios.get(url);

//         return res.data?.chart?.result?.[0]?.meta?.regularMarketPrice || null;

//     } catch (err) {
//         console.log("Yahoo price error:", err.message);
//         return null;
//     }
// }

// // =========================
// // PRICE RESOLVER
// // =========================
// async function getStockPrice(alert) {

//     const key = alert.instrumentKey || alert.symbol;

//     const cached = cache.get(key);
//     if (cached) return cached;

//     let price = null;

//     if (alert.instrumentKey) {
//         price = await getUpstoxPrice(alert.instrumentKey);
//     } else {
//         price = await getYahooPrice(alert.symbol);
//     }

//     if (price != null) {
//         cache.set(key, price);
//     }

//     return price;
// }

// // =========================
// // WORKER
// // =========================
// const processAlerts = async () => {
//     console.log(`[Worker] Running at ${new Date().toISOString()}`);

//     const alerts = await Alert.find({ triggered: false });
//     if (!alerts.length) return;

//     const now = Date.now();

//     for (const alert of alerts) {

//         const price = await getStockPrice(alert);
//         if (!price) continue;

//         let shouldSend = false;
//         let title = "Stock Alert";
//         let body = "";

//         // CONDITION
//         if (alert.alertType === "condition") {
//             if (alert.condition === ">" && price > alert.targetPrice) shouldSend = true;
//             if (alert.condition === "<" && price < alert.targetPrice) shouldSend = true;

//             title = "🎯 Target Hit";
//             body = `${alert.symbol}: ${price}`;
//         }

//         // INTERVAL
//         else if (alert.alertType === "interval") {
//             if (!alert.lastTriggeredAt) shouldSend = true;
//             else {
//                 const diff = (now - new Date(alert.lastTriggeredAt).getTime()) / 60000;
//                 if (diff >= alert.intervalMinutes) shouldSend = true;
//             }

//             title = `⏱ Update`;
//             body = `${alert.symbol}: ${price}`;
//         }

//         if (shouldSend) {
//             try {
//                 await admin.messaging().send({
//                     token: alert.deviceToken,
//                     notification: { title, body }
//                 });

//                 if (alert.alertType === "condition") {
//                     alert.triggered = true;
//                 } else {
//                     alert.lastTriggeredAt = new Date();
//                 }

//                 await alert.save();

//                 console.log("✅ Sent:", alert.symbol);

//             } catch (err) {
//                 console.log("FCM error:", err.message);
//             }
//         }
//     }
// };

// let running = false;

// const safeProcess = async () => {
//     if (running) return;
//     running = true;
//     try {
//         await processAlerts();
//     } finally {
//         running = false;
//     }
// };

// const startWorker = () => {
//     setInterval(safeProcess, 60000);
//     safeProcess();
// };

// module.exports = { startWorker };
const Alert = require("./models/Alert");
const { getUpstoxPrice, getFinnhubPrice } = require("./services/priceService");

async function runWorker() {
    const alerts = await Alert.find({ triggered: false });

    for (const alert of alerts) {

        let price = null;

        if (alert.region === "IN") {
            price = await getUpstoxPrice(alert.instrumentKey);
        } else {
            price = await getFinnhubPrice(alert.symbol);
        }

        if (!price) continue;

        let trigger = false;

        if (alert.alertType === "condition") {
            if (alert.condition === ">" && price >= alert.targetPrice) trigger = true;
            if (alert.condition === "<" && price <= alert.targetPrice) trigger = true;
        }

        if (trigger) {
            await sendNotification(alert.deviceToken, {
                title: "Stock Alert",
                body: `${alert.symbol} → ${price}`
            });

            alert.triggered = true;
            await alert.save();
        }
    }
}

async function sendNotification(token, payload) {
    const admin = require("firebase-admin");

    return admin.messaging().send({
        token,
        notification: payload
    });
}

setInterval(runWorker, 15000);

module.exports = runWorker;