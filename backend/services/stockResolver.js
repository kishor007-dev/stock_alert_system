
const Instrument = require("../models/Instrument");

// ==========================================
// MASTER DATABASE GATEKEEPER
// Validates symbols and fetches routing keys
// ==========================================
const resolveInstrument = async (symbol) => {
    // Force uppercase to match the normalized data from our seed script
    const cleanSymbol = symbol.toUpperCase().trim();
    
    const instrument = await Instrument.findOne({ symbol: cleanSymbol });

    if (!instrument) {
        // If it's not in our master DB, we reject it immediately.
        // This protects your external APIs from invalid queries.
        throw new Error(`Instrument ${cleanSymbol} not found in master database.`);
    }

    // Return the entire verified instrument document.
    // This naturally contains the correct 'region' and 'instrumentKey' mapped during seeding.
    return instrument;
};

module.exports = { resolveInstrument };