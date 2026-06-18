require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");
const zlib = require("zlib");
const csv = require("csv-parser");
const Instrument = require("../models/Instrument");

async function seedAllDB() {
    try {
        const dbUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        await mongoose.connect(dbUri);
        console.log("✅ Database connected. Starting MASSIVE multi-market seed process...");

        await Instrument.deleteMany({});
        console.log("🗑️ Cleared existing instruments.");

        const allInstruments = [];

        // ==========================================
        // 1. FETCH INDIAN STOCKS (UPSTOX)
        // ==========================================
        console.log("⬇️ Downloading Indian Market Data (Upstox CDN)...");
        
        const upstoxResponse = await axios({
            method: "get",
            url: "https://assets.upstox.com/market-quote/instruments/exchange/complete.csv.gz",
            responseType: "stream"
        });

        await new Promise((resolve, reject) => {
            upstoxResponse.data
                .pipe(zlib.createGunzip()) 
                .pipe(csv({
                    mapHeaders: ({ header }) => header.trim().toLowerCase()
                }))               
                .on("data", (row) => {
                    const key = row.instrument_key || "";
                    const segment = row.segment || "";

                    if (segment === "nse_eq" || key.toUpperCase().startsWith("NSE_EQ|")) {
                        if (row.trading_symbol || row.name) {
                            allInstruments.push({
                                symbol: (row.trading_symbol || row.name).trim(),
                                shortname: row.name || row.trading_symbol,
                                exchange: "NSE",
                                instrumentKey: key,
                                region: "IN"
                            });
                        }
                    }
                })
                .on("end", resolve)
                .on("error", reject);
        });
        
        console.log(`🇮🇳 Extracted ${allInstruments.length} Indian Equities.`);

        // ==========================================
        // 2. FETCH US STOCKS (FINNHUB)
        // ==========================================
        if (!process.env.FINNHUB_API_KEY) {
            console.warn("⚠️ FINNHUB_API_KEY missing in .env! Skipping US market seed.");
        } else {
            console.log("⬇️ Downloading US Market Data (Finnhub API)...");
            try {
                const finnhubResponse = await axios.get(
                    `https://finnhub.io/api/v1/stock/symbol?exchange=US&token=${process.env.FINNHUB_API_KEY}`
                );

                const cleanUsStocks = finnhubResponse.data.filter(stock => 
                    stock.type === "Common Stock" || stock.type === "ETP"
                ).map(stock => ({
                    symbol: stock.symbol.trim(),
                    shortname: stock.description,
                    exchange: stock.mic || "US",
                    region: "US",
                    instrumentKey: null 
                }));

                allInstruments.push(...cleanUsStocks);
                console.log(`🇺🇸 Extracted ${cleanUsStocks.length} US Equities & ETFs.`);
                
            } catch (finnhubErr) {
                console.error("❌ Finnhub Fetch Error:", finnhubErr.message);
            }
        }

        // ==========================================
        // 3. IN-MEMORY DEDUPLICATION (THE FIX)
        // ==========================================
        console.log(`🔍 Filtering out duplicate symbols from ${allInstruments.length} entries...`);
        
        const uniqueInstruments = [];
        const seenSymbols = new Set();

        for (const inst of allInstruments) {
            // If we haven't seen this symbol yet, keep it
            if (!seenSymbols.has(inst.symbol)) {
                seenSymbols.add(inst.symbol);
                uniqueInstruments.push(inst);
            }
        }

        const skippedCount = allInstruments.length - uniqueInstruments.length;
        console.log(`🛡️ Deduplication complete. Skipped ${skippedCount} duplicate symbol entries.`);

        // ==========================================
        // 4. DATABASE INSERTION
        // ==========================================
        console.log(`💾 Batch inserting ${uniqueInstruments.length} clean instruments into MongoDB...`);
        
        await Instrument.insertMany(uniqueInstruments);
        
        console.log(`🎉 SUCCESS! Your system now has both the entire Indian and US stock markets!`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Fatal Seeding Error:", error.message);
        process.exit(1);
    }
}

seedAllDB();