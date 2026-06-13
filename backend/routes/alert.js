// // const express = require('express'); 
// // const router = express.Router(); 
// // const axios = require('axios'); 
// // const Alert = require('../models/alert'); 
 
// // // POST /alerts -> Create a new alert 
// // router.post('/', async (req, res) => { 
// //     try { 
// //         const { symbol, condition, targetPrice, deviceToken } = req.body; 
         
// //         if (!symbol || !condition || !targetPrice || !deviceToken) { 
// //             return res.status(400).json({ error: 'All fields are required' });
// //          } 
 
// //         const newAlert = new Alert({ 
// //             symbol, 
// //             condition, 
// //             targetPrice, 
// //             deviceToken 
// //         }); 
 
// //         await newAlert.save(); 
// //         res.status(201).json({ message: 'Alert created successfully', alert: newAlert }); 
// //     } catch (error) { 
// //         console.error('Error creating alert:', error); 
// //         res.status(500).json({ error: 'Server Error' }); 
// //     } 
// // }); 
 
// // // GET /alerts -> List alerts for a specific device 
// // router.get('/', async (req, res) => { 
// //     try { 
// //         const { deviceToken } = req.query; 
// //         if (!deviceToken) return res.status(400).json({ error: 'deviceToken is required' }); 
 
// //         const alerts = await Alert.find({ deviceToken }).sort({ createdAt: -1 }); 
// //         res.json(alerts); 
// //     } catch (error) { 
// //         res.status(500).json({ error: 'Server Error' }); 
// //     } 
// // }); 
 
// // // GET /search -> Proxy for Yahoo search to bypass CORS 
// // router.get('/search', async (req, res) => { 
// //     try { 
// //         const { q } = req.query; 
// //         if (!q) return res.json([]); 
 
// //         const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${q}&quotesCount=5`; 
// //         const response = await axios.get(url); 
// //         res.json(response.data.quotes || []); 
// //     } catch (error) { 
// //         res.status(500).json({ error: 'Failed to fetch stocks' }); 
// //     } 
// // }); 
 
// // module.exports = router;
// const express = require('express');
// const router = express.Router();
// const axios = require('axios');
// const Alert = require('../models/Alert');

// // POST /alerts -> Create a new alert
// router.post('/', async (req, res) => {
//     try {
//         const { symbol, alertType, condition, targetPrice, intervalMinutes, deviceToken } = req.body;
        
//         if (!symbol || !alertType || !deviceToken) {
//             return res.status(400).json({ error: 'Missing required fields' });
//         }

//         const alertData = { symbol, alertType, deviceToken };

//         if (alertType === 'condition') {
//             if (!condition || !targetPrice) return res.status(400).json({ error: 'Condition and Target Price required' });
//             alertData.condition = condition;
//             alertData.targetPrice = targetPrice;
//         } else if (alertType === 'interval') {
//             alertData.intervalMinutes = intervalMinutes || 5;
//             alertData.condition = 'none';
//             alertData.lastTriggeredAt = null; // Forces immediate trigger on first worker run
//         }

//         const newAlert = new Alert(alertData);
//         await newAlert.save();
//         res.status(201).json({ message: 'Alert created successfully', alert: newAlert });
//     } catch (error) {
//         console.error('Error creating alert:', error);
//         res.status(500).json({ error: 'Server Error' });
//     }
// });

// // GET /alerts -> List alerts
// router.get('/', async (req, res) => {
//     try {
//         const { deviceToken } = req.query;
//         if (!deviceToken) return res.status(400).json({ error: 'deviceToken is required' });

//         const alerts = await Alert.find({ deviceToken }).sort({ createdAt: -1 });
//         res.json(alerts);
//     } catch (error) {
//         res.status(500).json({ error: 'Server Error' });
//     }
// });

// // DELETE /alerts/:id -> Cancel/Delete an active alert
// router.delete('/:id', async (req, res) => {
//     try {
//         const { id } = req.params;
//         await Alert.findByIdAndDelete(id);
//         res.json({ message: 'Alert cancelled successfully' });
//     } catch (error) {
//         console.error('Error deleting alert:', error);
//         res.status(500).json({ error: 'Server Error' });
//     }
// });

// // GET /search -> Proxy for Yahoo search
// router.get('/search', async (req, res) => {
//     try {
//         const { q } = req.query;
//         if (!q) return res.json([]);

//         const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${q}&quotesCount=5`;
//         const response = await axios.get(url);
//         res.json(response.data.quotes || []);
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to fetch stocks' });
//     }
// });

// module.exports = router;
const express = require('express');
const router = express.Router();
const axios = require('axios');
const Alert = require('../models/alert');

// Create Alert
const { resolveStock } = require("../services/stockResolver");
const { searchStock } = require("../services/yahooSearch");

router.post("/", async (req, res) => {
    try {
        const {
            symbol,
            alertType,
            condition,
            targetPrice,
            intervalMinutes,
            deviceToken
        } = req.body;

        if (!symbol || !alertType || !deviceToken) {
            return res.status(400).json({ error: "Missing fields" });
        }

        // 🔥 AUTO RESOLVE STOCK
        const resolved = await resolveStock(symbol);

        if (!resolved) {
            return res.status(400).json({ error: "Stock not found" });
        }

        const alertData = {
            symbol: resolved.symbol,
            instrumentKey: resolved.instrumentKey || null,
            alertType,
            deviceToken
        };

        if (alertType === "condition") {
            alertData.condition = condition;
            alertData.targetPrice = targetPrice;
        }

        if (alertType === "interval") {
            alertData.intervalMinutes = intervalMinutes;
            alertData.lastTriggeredAt = null;
        }

        const newAlert = new Alert(alertData);
        await newAlert.save();

        res.json({
            message: "Alert created",
            resolved
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Cancel Alert
router.delete('/:id', async (req, res) => {
    try {
        await Alert.findByIdAndDelete(req.params.id);
        res.json({ message: 'Alert cancelled' });
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// Search Proxy (Bypass CORS)
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) return res.json([]);

        const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${q}&quotesCount=5`;

        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/json"
            },
            timeout: 5000
        });

        const data = response?.data;

        if (!data || !data.quotes) {
            return res.json([]);
        }

        return res.json(data.quotes);

    } catch (error) {
        console.error("SEARCH ERROR:", error.message);
        return res.json([]);
    }
});

module.exports = router;
