
require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");
const Instrument = require("../models/Instrument");

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);

    const res = await axios.get(
        "https://api.upstox.com/v2/instruments",
        {
            headers: {
                Authorization: `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}`
            }
        }
    );

    const data = res.data.data;

    const formatted = data.map(i => ({
        symbol: i.tradingsymbol,
        name: i.name,
        exchange: i.exchange,
        instrumentKey: i.instrument_key,
        region: "IN"
    }));

    await Instrument.deleteMany({});
    await Instrument.insertMany(formatted);

    console.log("Seed complete:", formatted.length);
    process.exit();
}

seed();