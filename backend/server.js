// require('dotenv').config(); 
// const express = require('express'); 
// const cors = require('cors'); 
// const admin = require('firebase-admin'); 
// const connectDB = require('./config/db'); 
// const alertRoutes = require('./routes/alert'); 
// const { startWorker } = require('./worker'); 
 
// // Initialize Express App 
// const app = express(); 
 
// // Middleware 
// app.use(cors()); 
// app.use(express.json()); 

// const path = require('path');

// app.use(express.static(path.join(__dirname, '../frontend')));
 
// // Initialize Database 
// connectDB(); 
 
// // Initialize Firebase Admin SDK 
// try { 
//     const serviceAccount = require('./config/firebase-service-account.json'); 
//     admin.initializeApp({ 
//         credential: admin.credential.cert(serviceAccount) 
//     }); 
//     console.log('✅Firebase Admin Initialized'); 
// } catch (error) { 
//     console.error('❌Firebase Admin Initialization Error. Please ensure config/firebase-service-account.json exists.'); 
//     process.exit(1); 
// } 
 
// // Routes 
// app.use('/api/alerts', alertRoutes); 
 
// // Start Worker 
// startWorker(); 
 
// // Start Server 
// const PORT = process.env.PORT || 3000; 
// app.listen(PORT, () => { 
//     console.log(`
// 🚀
//  Server running on port ${PORT}`); 
// }); 
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const connectDB = require('./config/db');
const alertRoutes = require('./routes/alert');
const { startWorker } = require('./worker');

const app = express();
app.use(cors());
app.use(express.json());

try {
    admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
});

console.log('✅ Firebase Admin Initialized');
} catch (error) {
    console.error('❌ Firebase Admin Error. Ensure config/firebase-service-account.json exists.');
    process.exit(1);
}
connectDB()
  .then(() => {
    console.log("✅ MongoDB Connected");

    app.use('/api/alerts', alertRoutes);

    startWorker(); // ONLY after DB is ready

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

app.get('/', (req, res) => {
    res.json({
        status: "ok",
        message: "Stock Alert Backend is running 🚀"
    });
});