const mongoose = require("mongoose");

const instrumentSchema = new mongoose.Schema({
    symbol: String,
    name: String,
    exchange: String, // NSE / NASDAQ
    instrumentKey: String, // Upstox only
    region: String // IN / US
});

module.exports = mongoose.model("Instrument", instrumentSchema);