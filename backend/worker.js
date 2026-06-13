
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
const admin = require("firebase-admin");
const Alert = require("./models/alert");
const { getPrice } = require("./services/priceService");

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const processAlerts = async () => {
    console.log(`[Worker] Running at ${new Date().toISOString()}`);

    try {

        const alerts = await Alert.find({ triggered: false });

        if (!alerts.length) return;

        const grouped = {};

        // group by symbol (KEEP ORIGINAL BEHAVIOR)
        for (const a of alerts) {
            if (!grouped[a.symbol]) grouped[a.symbol] = [];
            grouped[a.symbol].push(a);
        }

        const now = Date.now();

        for (const symbol of Object.keys(grouped)) {

            await sleep(500);

            const sampleAlert = grouped[symbol][0];

            const price = await getPrice(sampleAlert);

            if (!price) continue;

            for (const alert of grouped[symbol]) {

                let shouldSend = false;

                // =====================
                // CONDITION ALERT
                // =====================
                if (alert.alertType === "condition") {

                    if (alert.condition === ">" && price > alert.targetPrice)
                        shouldSend = true;

                    if (alert.condition === "<" && price < alert.targetPrice)
                        shouldSend = true;

                    if (shouldSend)
                        alert.triggered = true;
                }

                // =====================
                // INTERVAL ALERT
                // =====================
                else if (alert.alertType === "interval") {

                    if (!alert.lastTriggeredAt) {
                        shouldSend = true;
                    } else {
                        const diff =
                            (now - new Date(alert.lastTriggeredAt).getTime()) / 60000;

                        if (diff >= alert.intervalMinutes)
                            shouldSend = true;
                    }

                    if (shouldSend)
                        alert.lastTriggeredAt = new Date();
                }

                // =====================
                // SEND NOTIFICATION
                // =====================
                if (shouldSend) {
                    try {
                        await admin.messaging().send({
                            token: alert.deviceToken,
                            notification: {
                                title: "📊 Stock Alert",
                                body: `${alert.symbol} → ${price}`
                            }
                        });

                        console.log(`✅ Sent: ${alert.symbol}`);

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
    console.log("🚀 Worker Started");
    setInterval(safeProcessAlerts, 60 * 1000);
    safeProcessAlerts();
};

module.exports = { startWorker };