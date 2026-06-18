
const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
    symbol: { 
        type: String, 
        required: [true, 'Stock symbol is required'], 
        index: true,
        uppercase: true,
        trim: true
    },
    region: { 
        type: String, 
        enum: {
            values: ['IN', 'US'],
            message: '{VALUE} is not a supported region'
        }, 
        required: true 
    },
    instrumentKey: { 
        type: String, 
        // Only required if it's an Indian stock (Upstox)
        required: function() { return this.region === 'IN'; }
    },
    finnhubSymbol: { 
        type: String, 
        // Only required if it's a US stock
        required: function() { return this.region === 'US'; }
    },
    alertType: { 
        type: String, 
        enum: ['condition', 'interval'], 
        required: true 
    },
    condition: { 
        type: String,
        enum: ['greater', 'less'],
        // Only required if the alert type is condition
        required: function() { return this.alertType === 'condition'; }
    },
    targetPrice: { 
        type: Number,
        required: function() { return this.alertType === 'condition'; },
        min: [0, 'Target price must be positive']
    },
    intervalMinutes: {
        type: Number,
        required: function() { return this.alertType === 'interval'; },
        min: [1, 'Interval must be at least 1 minute']
    },
    deviceToken: { 
        type: String, 
        required: true,
        index: true // Crucial for fast UI loads when fetching /api/alerts?deviceToken=...
    },
    triggered: { 
        type: Boolean, 
        default: false,
        index: true // Crucial for the background worker to instantly fetch active alerts
    },
    lastTriggeredAt: { 
        type: Date,
        default: null
    }
}, { 
    timestamps: true // Automatically adds createdAt and updatedAt 
});

// Optional but recommended: Compound index to prevent duplicate identical active alerts from the same device
alertSchema.index(
    { deviceToken: 1, symbol: 1, alertType: 1, condition: 1, targetPrice: 1, intervalMinutes: 1 }, 
    { unique: true, partialFilterExpression: { triggered: false } }
);

module.exports = mongoose.models.Alert || mongoose.model("Alert", alertSchema);