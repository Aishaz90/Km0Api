const mongoose = require('mongoose');
require('dotenv').config();

let isConnected = false;
let connectionPromise = null;

const connectDB = async () => {
    if (isConnected) {
        return;
    }

    if (connectionPromise) {
        return connectionPromise;
    }

    connectionPromise = new Promise(async (resolve, reject) => {
        try {
            const uri = 'mongodb+srv://elmardizarrouk:aicha021004@km0api.yxnuywq.mongodb.net/Km0Api?retryWrites=true&w=majority';

            const options = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                connectTimeoutMS: 5000,
                maxPoolSize: 10,
                minPoolSize: 5,
                maxIdleTimeMS: 10000,
                waitQueueTimeoutMS: 5000
            };

            await mongoose.connect(uri, options);
            isConnected = true;
            console.log('MongoDB connected successfully');
            resolve();
        } catch (error) {
            console.error('MongoDB connection error:', error);
            isConnected = false;
            connectionPromise = null;
            reject(error);
        }
    });

    return connectionPromise;
};

// Handle connection events
mongoose.connection.on('connected', () => {
    isConnected = true;
    console.log('MongoDB connected');
});

mongoose.connection.on('error', (err) => {
    isConnected = false;
    connectionPromise = null;
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    isConnected = false;
    connectionPromise = null;
    console.log('MongoDB disconnected');
});

// Export both the connection function and the connection state
module.exports = {
    connectDB,
    isConnected: () => isConnected
};