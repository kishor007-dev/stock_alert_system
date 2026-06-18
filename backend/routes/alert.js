
const express = require('express');
const router = express.Router();
const Alert = require('../models/alert'); // Ensure case matches your actual filename
const { resolveInstrument } = require('../services/stockResolver');

// ==========================================
// GET /api/alerts?deviceToken=...
// Fetches active deployments for the client UI
// ==========================================
router.get('/', async (req, res) => {
    try {
        const { deviceToken } = req.query;
        
        if (!deviceToken) {
            return res.status(400).json({ error: 'deviceToken is required' });
        }
        
        // Fetch newest alerts first for this specific device
        const alerts = await Alert.find({ deviceToken }).sort({ createdAt: -1 });
        res.json(alerts);
        
    } catch (error) {
        console.error('GET Alerts Error:', error);
        res.status(500).json({ error: 'Internal server error while fetching deployments' });
    }
});

// ==========================================
// POST /api/alerts
// Creates a new condition or interval alert
// ==========================================
router.post('/', async (req, res) => {
    try {
        const { symbol, alertType, condition, targetPrice, intervalMinutes, deviceToken } = req.body;

        // 1. Validate Core Payload
        if (!symbol || !alertType || !deviceToken) {
            return res.status(400).json({ error: "Missing required fields: symbol, alertType, deviceToken" });
        }

        // 2. Resolve via Master DB for Routing Context
        // This guarantees the instrument is valid and fetches the region/instrumentKey required by the worker
        const instrument = await resolveInstrument(symbol);
        
        if (!instrument) {
            return res.status(404).json({ error: `Instrument ${symbol} not found in master database` });
        }

        // 3. Construct and Save the Alert
        const newAlert = new Alert({
            symbol: instrument.symbol,
            region: instrument.region,
            instrumentKey: instrument.instrumentKey || undefined, // Upstox routing
            finnhubSymbol: instrument.region === 'US' ? instrument.symbol : undefined, // Finnhub routing
            alertType,
            condition,
            targetPrice,
            intervalMinutes,
            deviceToken
        });

        await newAlert.save();

        // 201 Created explicitly aligns with your app.js res.ok validation
        res.status(201).json(newAlert);

    } catch (err) {
        console.error('POST Alert Error:', err);
        // Cleanly catch and return Mongoose schema validation errors
        if (err.name === 'ValidationError') {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: 'Internal server error while creating alert' });
    }
});

// ==========================================
// DELETE /api/alerts/:id
// Terminates an active monitoring sequence
// ==========================================
router.delete('/:id', async (req, res) => {
    try {
        const deletedAlert = await Alert.findByIdAndDelete(req.params.id);
        
        if (!deletedAlert) {
            return res.status(404).json({ error: "Alert not found or already terminated" });
        }
        
        // Returning success:true satisfies the frontend res.ok check
        res.json({ success: true });
        
    } catch (error) {
        console.error('DELETE Alert Error:', error);
        res.status(500).json({ error: 'Internal server error while terminating alert' });
    }
});

module.exports = router;