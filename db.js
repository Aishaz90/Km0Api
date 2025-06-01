const mongoose = require('mongoose');
require('dotenv').config();

const connectWithRetry = async () => {
    const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 5,
        keepAlive: true,
        keepAliveInitialDelay: 300000
    };

    try {
        console.log('Attempting to connect to MongoDB...');
        const uri = 'mongodb+srv://elmardizarrouk:aicha021004@km0api.yxnuywq.mongodb.net/Km0Api?retryWrites=true&w=majority';
        await mongoose.connect(uri, options);
        console.log('MongoDB connected successfully');
        return true;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        console.log('Retrying connection in 5 seconds...');
        setTimeout(connectWithRetry, 5000);
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
    console.log('Attempting to reconnect...');
    connectWithRetry();
});

// Initial connection
connectWithRetry();

const isConnected = () => {
    const state = mongoose.connection.readyState;
    console.log('Current MongoDB connection state:', state);
    return state === 1;
};

module.exports = {
    connectDB: connectWithRetry,
    isConnected
};