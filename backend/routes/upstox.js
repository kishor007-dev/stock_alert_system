app.get("/auth/upstox/login", (req, res) => {
    const url =
        `https://api.upstox.com/v2/login/authorization/dialog` +
        `?response_type=code` +
        `&client_id=${process.env.UPSTOX_API_KEY}` +
        `&redirect_uri=https://stock-alert-system-fctp.onrender.com/auth/upstox/callback`;

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