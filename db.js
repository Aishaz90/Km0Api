const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = 'mongodb+srv://elmardizarrouk:aicha021004@km0api.yxnuywq.mongodb.net/Km0Api?retryWrites=true&w=majority';

const connectDB = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            console.log('Already connected to MongoDB');
            return true;
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            maxPoolSize: 10,
            minPoolSize: 5,
            keepAlive: true,
            keepAliveInitialDelay: 300000
        });

        console.log('MongoDB connected successfully');
        return true;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        return false;
    }
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('MongoDB connected event fired');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error event:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected event fired');
});

const isConnected = () => {
    const state = mongoose.connection.readyState;
    console.log('Current MongoDB connection state:', state);
    return state === 1;
};

module.exports = {
    connectDB,
    isConnected
};