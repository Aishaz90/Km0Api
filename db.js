const mongoose = require('mongoose');
require('dotenv').config();

let isConnected = false;

const connectDB = async () => {
    if (isConnected) {
        console.log('Using existing database connection');
        return;
    }

    try {
        const uri = 'mongodb+srv://elmardizarrouk:aicha021004@km0api.yxnuywq.mongodb.net/Km0Api?retryWrites=true&w=majority';

        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        await mongoose.connect(uri, options);
        isConnected = true;
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        isConnected = false;
        throw error;
    }
};

// Handle connection events
mongoose.connection.on('connected', () => {
    isConnected = true;
    console.log('MongoDB connected');
});

mongoose.connection.on('error', (err) => {
    isConnected = false;
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.log('MongoDB disconnected');
});

// Export both the connection function and the connection state
module.exports = {
    connectDB,
    isConnected: () => isConnected
};