// // Import and configure the Firebase SDK for the Service Worker 
// importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
// importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");
 
// // TODO: Replace with your Firebase Web Config (Same as in app.js) 
// const firebaseConfig = {
//   apiKey: "AIzaSyBAW4QPXcZtFcPnNyduVzhfI4cHyHNR6FM",
//   authDomain: "stock-analyzer-001-334e6.firebaseapp.com",
//   projectId: "stock-analyzer-001-334e6",
//   storageBucket: "stock-analyzer-001-334e6.firebasestorage.app",
//   messagingSenderId: "120181856561",
//   appId: "1:120181856561:web:a24a80b83076ef37e57810",
//   measurementId: "G-7W15CJBDVH"
// };
 
// firebase.initializeApp(firebaseConfig); 
// const messaging = firebase.messaging(); 
 
// // Handle Background Messages 
// messaging.onBackgroundMessage((payload) => { 
//     console.log('[firebase-messaging-sw.js] Received background message ', payload); 
     
//     const notificationTitle = payload.notification.title; 
//     const notificationOptions = { 
//         body: payload.notification.body, 
//         icon: 'https://cdn-icons-png.flaticon.com/512/2933/2933116.png' 
//     }; 
 
//     self.registration.showNotification(notificationTitle, notificationOptions); 
// }); 
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// TODO: Replace with your actual config!
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

