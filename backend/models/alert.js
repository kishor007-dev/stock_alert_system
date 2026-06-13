// // const mongoose = require('mongoose'); 
 
// // const alertSchema = new mongoose.Schema({ 
// //     symbol: {  
// //         type: String,  
// //         required: true, 
// //         uppercase: true 
// //     }, 
// //     condition: {  
// //         type: String,  
// //         enum: ['>', '<'],  
// //         required: true  
// //     }, 
// //     targetPrice: {  
// //         type: Number,  
// //         required: true  
// //     }, 
// //     triggered: {  
// //         type: Boolean,  
// //         default: false  
// //     }, 
// //     deviceToken: {  
// //         type: String,  
// //         required: true  
// //     }, 
// //     createdAt: {  
// //         type: Date,  
// //         default: Date.now  
// //     } 
// // }); 
 
// // module.exports = mongoose.model('Alert', alertSchema); 
// const mongoose = require('mongoose');

// const alertSchema = new mongoose.Schema({
//     symbol: { 
//         type: String, 
//         required: true,
//         uppercase: true
//     },
//     alertType: {
//         type: String,
//         enum: ['condition', 'interval'],
//         default: 'condition' // 'condition' = target price, 'interval' = every 5 mins
//     },
//     condition: { 
//         type: String, 
//         enum: ['>', '<', 'none'], 
//         default: 'none' 
//     },
//     targetPrice: { 
//         type: Number, 
//         default: null 
//     },
//     intervalMinutes: {
//         type: Number,
//         default: null
//     },
//     triggered: { 
//         type: Boolean, 
//         default: false 
//     },
//     lastTriggeredAt: {
//         type: Date,
//         default: null
//     },
//     deviceToken: { 
//         type: String, 
//         required: true 
//     },
//     createdAt: { 
//         type: Date, 
//         default: Date.now 
//     }
// });

// module.exports = mongoose.model('Alert', alertSchema);
const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    symbol: { type: String, required: true, uppercase: true },
    instrumentKey: {
    type: String,
    required: true
},
    alertType: { type: String, enum: ['condition', 'interval'], default: 'condition' },
    condition: { type: String, enum: ['>', '<', 'none'], default: 'none' },
    targetPrice: { type: Number, default: null },
    intervalMinutes: { type: Number, default: null },
    triggered: { type: Boolean, default: false },
    lastTriggeredAt: { type: Date, default: null },
    deviceToken: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', alertSchema);