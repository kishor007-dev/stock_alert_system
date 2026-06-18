const admin = require('firebase-admin');

// ==========================================
// FIREBASE PUSH NOTIFICATION SERVICE
// Handles sending alerts to specific devices
// ==========================================
const sendPushNotification = async (token, title, body) => {
    try {
        const message = {
            notification: {
                title: title,
                body: body
            },
            token: token
        };

        // Send a message to the device corresponding to the provided registration token.
        const response = await admin.messaging().send(message);
        console.log(`✅ Push notification sent successfully! Message ID: ${response}`);
        
    } catch (error) {
        console.error(`❌ Error sending push notification:`, error.message);
        
        // Fail-safe: If the user revoked notification permissions or uninstalled the app,
        // Firebase will throw this specific error. 
        if (error.code === 'messaging/registration-token-not-registered') {
            console.log(`⚠️ Token ${token.substring(0, 10)}... is no longer valid.`);
            // In a larger production app, you would delete this token from the Database here 
            // so you don't keep trying to send messages to a dead device.
        }
    }
};

module.exports = { sendPushNotification };