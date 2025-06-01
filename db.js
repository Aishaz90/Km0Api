const mongoose = require('mongoose');
require('dotenv').config();

let isConnecting = false;
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

const connectDB = async () => {
    if (isConnecting) {
        console.log('Connection attempt already in progress...');
        return false;
    }

    if (mongoose.connection.readyState === 1) {
        console.log('Already connected to MongoDB');
        return true;
    }

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
        isConnecting = true;
        console.log('Attempting to connect to MongoDB...');
        const uri = 'mongodb+srv://elmardizarrouk:aicha021004@km0api.yxnuywq.mongodb.net/Km0Api?retryWrites=true&w=majority';
        await mongoose.connect(uri, options);
        console.log('MongoDB connected successfully');
        retryCount = 0;
        return true;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        retryCount++;

        if (retryCount < MAX_RETRIES) {
            console.log(`Retrying connection in ${RETRY_DELAY / 1000} seconds... (Attempt ${retryCount}/${MAX_RETRIES})`);
            setTimeout(() => {
                isConnecting = false;
                connectDB();
            }, RETRY_DELAY);
        } else {
            console.error('Max retry attempts reached. Please check your connection settings.');
            isConnecting = false;
        }
        return false;
    } finally {
        isConnecting = false;
    }
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('MongoDB connected event fired');
    retryCount = 0;
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error event:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected event fired');
    if (retryCount < MAX_RETRIES) {
        console.log('Attempting to reconnect...');
        setTimeout(() => {
            if (!isConnecting) {
                connectDB();
            }
        }, RETRY_DELAY);
    }
});

// Handle process termination
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
    } catch (err) {
        console.error('Error during MongoDB connection closure:', err);
        process.exit(1);
    }
});

const isConnected = () => {
    const state = mongoose.connection.readyState;
    console.log('Current MongoDB connection state:', state);
    return state === 1;
};

// Initial connection
connectDB();

module.exports = {
    connectDB,
    isConnected
};