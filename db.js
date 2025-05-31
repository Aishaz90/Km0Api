const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');
    } catch (error) {
        console.log('Unable to Connect to DB:', error.message);
        throw error;
    }
};

module.exports = connectDB;