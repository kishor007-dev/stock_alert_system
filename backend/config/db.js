// const mongoose = require('mongoose'); 
 
// const connectDB = async () => { 
//     try { 
//         await mongoose.connect(process.env.MONGO_URI); 
//         console.log('✅MongoDB Connected'); 
//     } catch (err) { 
//         console.error('❌MongoDB Connection Error:', err.message); 
//         process.exit(1); 
//     } 
// }; 
 
// module.exports = connectDB;
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;