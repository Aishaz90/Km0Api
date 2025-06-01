const mongoose = require('mongoose');
require('dotenv').config();

// Cache the database connection
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    try {
        if (cached.conn) {
            console.log('Using cached database connection');
            return true;
        }

        if (!cached.promise) {
            const options = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                bufferCommands: false,
                maxPoolSize: 10,
                minPoolSize: 5,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                connectTimeoutMS: 10000,
                family: 4,
                keepAlive: true,
                keepAliveInitialDelay: 300000
            };

            console.log('Creating new database connection...');
            cached.promise = mongoose.connect('mongodb+srv://elmardizarrouk:aicha021004@km0api.yxnuywq.mongodb.net/Km0Api?retryWrites=true&w=majority', options)
                .then((mongoose) => {
                    console.log('MongoDB connected successfully');
                    return mongoose;
                })
                .catch((err) => {
                    console.error('MongoDB connection error:', err);
                    cached.promise = null;
                    throw err;
                });
        }

        cached.conn = await cached.promise;
        return true;
    } catch (error) {
        console.error('Error in connectDB:', error);
        cached.promise = null;
        return false;
    }
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('MongoDB connected event fired');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error event:', err);
    cached.conn = null;
    cached.promise = null;
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected event fired');
    cached.conn = null;
    cached.promise = null;
});

const isConnected = () => {
    const state = mongoose.connection.readyState;
    console.log('Current MongoDB connection state:', state);
    return state === 1 || cached.conn !== null;
};

module.exports = {
    connectDB,
    isConnected
};