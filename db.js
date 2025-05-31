const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = 'mongodb+srv://elmardizarrouk:aicha021004@km0api.yxnuywq.mongodb.net/Km0Api?retryWrites=true&w=majority';

// Cache the database connection
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
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

        cached.promise = mongoose.connect(MONGODB_URI, opts)
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

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    cached.conn = null;
    cached.promise = null;
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
    cached.conn = null;
    cached.promise = null;
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

module.exports = {
    connectDB,
    isConnected: () => !!cached.conn
};