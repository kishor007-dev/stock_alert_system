
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

// ==========================================
// ARCHITECTURE IMPORTS
// ==========================================
const connectDB = require('./config/db');
const { initFirebase } = require('./config/firebase');
const { startWorker } = require('./worker');

const searchRoutes = require('./routes/search');
const alertRoutes = require('./routes/alert'); // Note the updated plural name

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ==========================================
// CORE API ROUTES
// ==========================================
// Mapped to match exactly what your app.js holographic UI expects
app.use('/api/alerts/search', searchRoutes); 
app.use('/api/alerts', alertRoutes);

// System Health Check
app.get('/', (req, res) => {
    res.json({
        status: "ok",
        message: "Stock Alert Backend Engine is live 🚀"
    });
});

// ==========================================
// UPSTOX OAUTH2 FLOW
// ==========================================
app.get("/auth/upstox/login", (req, res) => {
    const clientId = process.env.UPSTOX_API_KEY;
    const redirectUri = "https://stock-alert-system-fctp.onrender.com/auth/upstox/callback";

    const url = `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    res.redirect(url);
});

app.get("/auth/upstox/callback", async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.status(400).send("No authorization code received");
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
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            }
        );

        const accessToken = response.data.access_token;
        console.log("✅ UPSTOX TOKEN SUCCESSFULLY REFRESHED");

        // ⚠️ ARCHITECTURE NOTE: Mutating process.env at runtime works fine for a single Node instance. 
        // If you ever scale this to multiple load-balanced servers, you must store this token in MongoDB or Redis!
        process.env.UPSTOX_ACCESS_TOKEN = accessToken;

        res.send("Upstox connected successfully. You can close this tab and return to the dashboard.");
    } catch (err) {
        console.error("Token error:", err.response?.data || err.message);
        res.status(500).send("Token generation failed. Check your API credentials.");
    }
});

// ==========================================
// SYSTEM BOOTLOADER
// ==========================================
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // 1. Initialize Database
        await connectDB();
        
        // 2. Initialize Firebase via the config module
        initFirebase();
        
        // 3. Boot Background Alert Engine (strictly after DB is ready)
        startWorker(); 
        console.log("✅ Background Alert Engine Activated");

        // 4. Expose the Express API
        app.listen(PORT, () => {
            console.log(`🚀 API Gateway running on port ${PORT}`);
        });

    } catch (err) {
        console.error("❌ Fatal Boot Error:", err);
        process.exit(1);
    }
};

// Execute boot sequence
startServer();