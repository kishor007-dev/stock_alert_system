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
app.use("/api/search", require("./routes/search"));
app.use("/api/alerts", require("./routes/alert"));
console.log("UPSTOX_API_KEY:", process.env.UPSTOX_API_KEY);
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
app.get("/auth/upstox/login", (req, res) => {
    const clientId = process.env.UPSTOX_API_KEY;
    
    const redirectUri =
        "https://stock-alert-system-fctp.onrender.com/auth/upstox/callback";

    const url =
        `https://api.upstox.com/v2/login/authorization/dialog` +
        `?response_type=code` +
        `&client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}`;

    res.redirect(url);
});

const axios = require("axios");

app.get("/auth/upstox/callback", async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.send("No authorization code received");
    }

    try {
        const response = await axios.post(
            "https://api.upstox.com/v2/login/authorization/token",
            new URLSearchParams({
                code,
                client_id: process.env.UPSTOX_API_KEY,
                client_secret: process.env.UPSTOX_API_SECRET,
                redirect_uri: "https://stock-alert-system-fctp.onrender.com/auth/upstox/callback",
                grant_type: "authorization_code"
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        );

        const accessToken = response.data.access_token;

        console.log("✅ UPSTOX TOKEN RECEIVED");

        // TEMP store in env (better: DB later)
        process.env.UPSTOX_ACCESS_TOKEN = accessToken;

        res.send("Upstox connected successfully. You can close this tab.");
    } catch (err) {
        console.log("Token error:", err.response?.data || err.message);
        res.send("Token generation failed");
    }
});
