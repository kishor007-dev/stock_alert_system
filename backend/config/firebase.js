const admin = require('firebase-admin');

// ==========================================
// FIREBASE ADMIN SDK INITIALIZATION
// Centralized configuration for background notifications
// ==========================================
const initFirebase = () => {
    try {
        // Prevent re-initialization if it's already running
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    // The replace function ensures multiline private keys from the .env file format correctly
                    privateKey: process.env.FIREBASE_PRIVATE_KEY 
                        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
                        : undefined,
                }),
            });
            console.log('✅ Firebase Admin Initialized');
        }
    } catch (error) {
        console.error('❌ Firebase Initialization Error:', error.message);
    }
};

// We export BOTH the init function (for server.js) and the admin object (for notificationService.js)
module.exports = { initFirebase, admin };