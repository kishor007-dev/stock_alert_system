const axios = require("axios");

function getToken() {
    return process.env.UPSTOX_ACCESS_TOKEN;
}

// instrumentKey format: NSE_EQ|INE002A01018
async function getUpstoxPrice(instrumentKey) {
    try {
        const res = await axios.get(
            `https://api.upstox.com/v2/market-quote/ltp?instrument_key=${instrumentKey}`,
            {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                    Accept: "application/json"
                },
                timeout: 5000
            }
        );

        return res.data?.data?.[instrumentKey]?.last_price || null;

    } catch (err) {
        console.log(
            "Upstox price error:",
            err.response?.data || err.message
        );
        return null;
    }
}

module.exports = { getUpstoxPrice };