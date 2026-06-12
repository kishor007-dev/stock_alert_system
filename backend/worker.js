// const axios = require('axios'); 
// const admin = require('firebase-admin'); 
// const Alert = require('./models/alert'); 
 
// // Define worker function 
// const processAlerts = async () => { 
//     console.log(`[Worker] Running stock check at ${new Date().toISOString()}`); 
//     try { 
//         // 1. Fetch only untriggered alerts 
//         const activeAlerts = await Alert.find({ triggered: false }); 
//         if (activeAlerts.length === 0) return; 
 
//         // 2. Group alerts by stock symbol (Optimization: Prevents duplicate API calls) 
//         const symbolMap = {};  
//         activeAlerts.forEach(alert => { 
//             if (!symbolMap[alert.symbol]) { 
//                 symbolMap[alert.symbol] = []; 
//             } 
//             symbolMap[alert.symbol].push(alert); 
//         }); 
 
//         const symbols = Object.keys(symbolMap); 
 
//         // 3. Process each unique symbol 
//         for (const symbol of symbols) { 
//             try { 
//                 // Fetch latest price from Yahoo Finance 
//                 const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`; 
//                 const response = await axios.get(url); 
                 
//                 const meta = response.data.chart.result[0].meta; 
//                 const currentPrice = meta.regularMarketPrice; 
//                 const currency = meta.currency || 'USD'; 
 
//                 const alertsForSymbol = symbolMap[symbol]; 
 
//                 // 4. Evaluate conditions for all alerts tied to this symbol 
//                 for (const alert of alertsForSymbol) { 
//                     let conditionMet = false; 
                     
//                     if (alert.condition === '>' && currentPrice > alert.targetPrice) conditionMet = true; 
//                     if (alert.condition === '<' && currentPrice < alert.targetPrice) conditionMet = true; 
 
//                     if (conditionMet) { 
//                         // Send Firebase Push Notification 
//                         const message = { 
//                             notification: { 
//                                 title: '📈Stock Alert Triggered!', 
//                                 body: `${symbol} hit ${currentPrice} ${currency} (Condition: 
// ${alert.condition} ${alert.targetPrice})` 
//                             }, 
//                             token: alert.deviceToken 
//                         }; 
 
//                         try { 
//                             await admin.messaging().send(message); 
//                             console.log(`
// ✅
//  Notification sent for ${symbol} to token 
// ${alert.deviceToken.substring(0,10)}...`); 
                             
//                             // Mark as triggered to avoid duplicate alerts 
//                             alert.triggered = true; 
//                             await alert.save(); 
//                         } catch (fcmError) { 
//                             console.error(`
// ❌
//  FCM Error for ${symbol}:`, fcmError.message); 
//                             // If token is invalid, we might want to delete the alert here in a real production 
// app 
//                         } 
//                     } 
//                 } 
//             } catch (err) { 
//                 console.error(`
// ❌
//  Yahoo API Error for ${symbol}:`, err.message); 
//             } 
//         } 
//     } catch (error) { 
//         console.error("❌ Worker Error:", error); 
//     } 
// }; 
 
// // Start the worker to run every 60 seconds 
// const startWorker = () => { 
//     setInterval(processAlerts, 60000); // 60,000 ms = 1 minute 
//     processAlerts(); // Run once immediately on startup 
// }; 
 
// module.exports = { startWorker };
const axios = require('axios');
const admin = require('firebase-admin');
const Alert = require('./models/alert');

const processAlerts = async () => {
    console.log(`[Worker] Running stock check at ${new Date().toISOString()}`);
    try {
        const activeAlerts = await Alert.find({ triggered: false });
        if (activeAlerts.length === 0) return;

        const symbolMap = {}; 
        activeAlerts.forEach(a => {
            if (!symbolMap[a.symbol]) symbolMap[a.symbol] = [];
            symbolMap[a.symbol].push(a);
        });

        const now = new Date();

        for (const symbol of Object.keys(symbolMap)) {
            try {
                const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
                const meta = response.data.chart.result[0].meta;
                const currentPrice = meta.regularMarketPrice;
                const currency = meta.currency || 'USD';

                for (const alert of symbolMap[symbol]) {
                    let shouldNotify = false;
                    let title = '📈 Stock Alert!';
                    let body = '';

                    // 1. Evaluate Condition Alert
                    if (alert.alertType === 'condition') {
                        if (alert.condition === '>' && currentPrice > alert.targetPrice) shouldNotify = true;
                        if (alert.condition === '<' && currentPrice < alert.targetPrice) shouldNotify = true;
                        title = '📈 Target Reached!';
                        body = `${symbol} hit ${currentPrice} ${currency} (Target: ${alert.condition} ${alert.targetPrice})`;
                    } 
                    // 2. Evaluate Interval Alert
                    else if (alert.alertType === 'interval') {
                        if (!alert.lastTriggeredAt) {
                            shouldNotify = true;
                        } else {
                            const diffMinutes = (now.getTime() - new Date(alert.lastTriggeredAt).getTime()) / 60000;
                            if (diffMinutes >= alert.intervalMinutes) shouldNotify = true;
                        }
                        title = `⏱️ ${alert.intervalMinutes}-Min Update: ${symbol}`;
                        body = `Current Price: ${currentPrice} ${currency}`;
                        console.log(body)
                    }

                    if (shouldNotify) {
                        try {
                            await admin.messaging().send({
                                notification: { title, body },
                                webpush: {
                                    notification: {
                                        icon: 'https://cdn-icons-png.flaticon.com/512/2933/2933116.png'
                                    }
                                },
                                token: alert.deviceToken
                            });
                            console.log(`✅ Sent notification for ${symbol}`);
                            
                            if (alert.alertType === 'condition') {
                                alert.triggered = true;
                            } else {
                                alert.lastTriggeredAt = now;
                            }
                            await alert.save();
                        } catch (fcmErr) {
                            console.error(`❌ FCM Error for ${symbol}:`, fcmErr.message);
                            // Auto-delete bad tokens to prevent crash loops
                            if (fcmErr.code === 'messaging/registration-token-not-registered' || fcmErr.message.includes('entity was not found')) {
                                console.log(`🗑️ Deleting dead alert ID: ${alert._id}`);
                                await Alert.findByIdAndDelete(alert._id);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error(`❌ Yahoo API Error for ${symbol}:`, err.message);
            }
        }
    } catch (error) {
        console.error("❌ Worker Error:", error);
    }
};

const startWorker = () => {
    setInterval(processAlerts, 60000); // Check every 60 seconds
    processAlerts(); 
};

module.exports = { startWorker };