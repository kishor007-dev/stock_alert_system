
const Alert = require('./models/alert');
const { getLivePrice } = require('./services/priceService');
const { sendPushNotification } = require('./services/notificationService');

// Concurrency lock to prevent overlapping worker cycles
let isProcessing = false;

const runWorker = async () => {
    // If the previous cycle is still waiting on API responses, skip this cycle
    if (isProcessing) return;
    isProcessing = true;

    try {
        // 1. Fetch all active alerts 
        const activeAlerts = await Alert.find({ triggered: false });

        if (activeAlerts.length === 0) {
            isProcessing = false;
            return; // Exit cleanly if there's no work to do
        }

        // 2. BATCHING OPTIMIZATION
        // Group alerts by symbol so we only fetch the live price ONCE per stock,
        // even if 100 users are tracking the same instrument.
        const groupedAlerts = activeAlerts.reduce((acc, alert) => {
            if (!acc[alert.symbol]) acc[alert.symbol] = [];
            acc[alert.symbol].push(alert);
            return acc;
        }, {});

        // 3. Process each instrument group
        for (const symbol in groupedAlerts) {
            const alertsForSymbol = groupedAlerts[symbol];
            
            // Extract routing context from the first alert in the group
            const instrumentContext = {
                symbol: symbol,
                region: alertsForSymbol[0].region,
                instrumentKey: alertsForSymbol[0].instrumentKey
            };

            try {
                // This hits our unified, Redis/NodeCache-protected service layer
                const Price = await getLivePrice(instrumentContext);
                const livePrice=Number(Price).toFixed(2);

                // Evaluate all user alerts for this specific stock against the single price fetch
                for (const alert of alertsForSymbol) {
                    let shouldTrigger = false;
                    let notificationTitle = '';
                    let notificationBody = '';

                    // ==========================================
                    // EVALUATE CONDITION ALERTS
                    // ==========================================
                    if (alert.alertType === 'condition') {
                        if (alert.condition === 'greater' && livePrice >= alert.targetPrice) {
                            shouldTrigger = true;
                            notificationTitle = `🎯 Target Hit: ${symbol}`;
                            notificationBody = `${symbol} crossed above $${alert.targetPrice}! Current: 🪙${livePrice}`;
                        } else if (alert.condition === 'less' && livePrice <= alert.targetPrice) {
                            shouldTrigger = true;
                            notificationTitle = `📉 Target Dropped: ${symbol}`;
                            notificationBody = `${symbol} dropped below $${alert.targetPrice}! Current: 🪙${livePrice}`;
                        }

                        if (shouldTrigger) {
                            await sendPushNotification(alert.deviceToken, notificationTitle, notificationBody);
                            alert.triggered = true; // Mark as resolved
                            alert.lastTriggeredAt = new Date();
                            await alert.save();
                        }
                    } 
                    // ==========================================
                    // EVALUATE INTERVAL ALERTS
                    // ==========================================
                    else if (alert.alertType === 'interval') {
                        const now = new Date();
                        const lastRun = alert.lastTriggeredAt || alert.createdAt;
                        const diffMins = Math.floor((now - lastRun) / 60000); // Convert ms to minutes

                        // If the specified interval has passed, or it has never triggered yet
                        if (diffMins >= alert.intervalMinutes || !alert.lastTriggeredAt) {
                            notificationTitle = `⏱️ Interval Update: ${symbol}`;
                            notificationBody = `${symbol} is currently trading at 🪙${livePrice}`;
                            
                            await sendPushNotification(alert.deviceToken, notificationTitle, notificationBody);
                            
                            // Do not set triggered = true, because intervals must keep running
                            alert.lastTriggeredAt = now;
                            await alert.save();
                        }
                    }
                }
            } catch (apiErr) {
                // ISOLATE FAILURES: 
                // If Upstox throws an error for RELIANCE, we catch it here so the loop 
                // continues and still evaluates Finnhub prices for AAPL.
                console.error(`Worker skipped ${symbol} evaluation due to API error:`, apiErr.message);
            }
        }
    } catch (dbErr) {
        console.error("Worker Engine Database Error:", dbErr.message);
    } finally {
        // ALWAYS release the lock when finished, even if errors occurred
        isProcessing = false;
    }
};

// Start the engine
const startWorker = () => {
    console.log("⚙️ Background Alert Engine Initialized...");
    setInterval(runWorker, 15000); // Evaluate every 15 seconds
};

module.exports = { startWorker };