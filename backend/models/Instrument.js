const mongoose = require("mongoose");

const instrumentSchema = new mongoose.Schema({
    symbol: { 
        type: String, 
        required: [true, 'Stock symbol is required'], 
        unique: true, // Prevents duplicate entries from the seed script
        index: true,
        uppercase: true,
        trim: true
    },
    shortname: { 
        type: String, 
        required: [true, 'Instrument name is required'],
        trim: true // Aligned to match your frontend expectation of stock.shortname
    },
    exchange: { 
        type: String, 
        required: true,
        uppercase: true,
        trim: true
    },
    instrumentKey: { 
        type: String, 
        // Strict validation: Only required if routing through the Upstox API
        required: function() { return this.region === 'IN'; }
    },
    region: { 
        type: String, 
        enum: {
            values: ['IN', 'US'],
            message: '{VALUE} is not a supported region'
        },
        required: true,
        index: true // Useful if you ever need to fetch/filter by market
    }
});

// CRITICAL: Compound text index for the hybrid search system.
// This allows your searchService.js to perform lightning-fast queries against both fields simultaneously.
instrumentSchema.index({ symbol: 'text', shortname: 'text' });

module.exports = mongoose.model("Instrument", instrumentSchema);