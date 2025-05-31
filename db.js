const mongoose = require('mongoose');
require('dotenv').config();

const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,
    maxPoolSize: 10,
    minPoolSize: 5,
    keepAlive: true,
    keepAliveInitialDelay: 300000
};

let cachedConnection = null;

const connectDB = async () => {
    if (cachedConnection) {
        return cachedConnection;
    }

    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        const connection = await mongoose.connect(process.env.MONGODB_URI, options);
        cachedConnection = connection;
        console.log('Connected to MongoDB successfully');
        return connection;
    } catch (error) {
        console.error('Unable to Connect to DB:', error.message);
        throw error;
    }
};

// Handle connection events
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
    cachedConnection = null;
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
    cachedConnection = null;
});

mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
});

// Clean up connection on process termination
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
    } catch (err) {
        console.error('Error during MongoDB connection cleanup:', err);
        process.exit(1);
    }
});

module.exports = connectDB;
