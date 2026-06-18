const Instrument = require('../models/Instrument');

// ==========================================
// MONGODB HYBRID SEARCH ENGINE
// Powers the frontend autocomplete dropdown
// ==========================================
const searchStocks = async (query) => {
    // Safety net: don't execute heavy DB queries for single characters
    if (!query || query.length < 2) return [];

    try {
        // Use a case-insensitive regex for partial matching (e.g., typing "REL" finds "RELIANCE")
        const regex = new RegExp(query, 'i');

        const results = await Instrument.find({
            $or: [
                { symbol: regex },
                { shortname: regex } // Searching against the shortname we mapped in the seed script
            ]
        })
        .limit(10) // Limit to 10 to keep the UI dropdown snappy and avoid overwhelming the DOM
        .select('symbol shortname -_id') // Project only what the frontend needs; strip the heavy Mongo _id
        .lean(); // .lean() returns plain JSON instead of heavy Mongoose documents, boosting read speed

        return results;
    } catch (error) {
        console.error("Database Search Error:", error.message);
        throw new Error("Failed to execute instrument search");
    }
};

module.exports = { searchStocks };