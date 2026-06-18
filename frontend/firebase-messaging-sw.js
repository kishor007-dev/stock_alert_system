
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const firebaseConfig = {
     apiKey: "AIzaSyBAW4QPXcZtFcPnNyduVzhfI4cHyHNR6FM",
     authDomain: "stock-analyzer-001-334e6.firebaseapp.com",
     projectId: "stock-analyzer-001-334e6",
     storageBucket: "stock-analyzer-001-334e6.firebasestorage.app",
     messagingSenderId: "120181856561",
     appId: "1:120181856561:web:a24a80b83076ef37e57810",
     measurementId: "G-7W15CJBDVH"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// ==========================================
// BACKGROUND NOTIFICATION HANDLER
// Triggers when the tab is closed or minimized
// ==========================================
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        // Optional: If you have a logo, point this to it (e.g., '/logo.png')
        icon: '/favicon.ico', 
        // Ensures older notifications from the same app don't stack infinitely
        tag: 'stock-alert-notification' 
    };

    // Instructs the browser to trigger the native OS push notification
    self.registration.showNotification(notificationTitle, notificationOptions);
});

