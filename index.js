require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/images', express.static(path.join(__dirname, 'images')));

// Routes
app.use('/auth', require('./Route/auth.routes'));
app.use('/menu', require('./Route/menu.routes'));
app.use('/reservations', require('./Route/reservation.routes'));
app.use('/events', require('./Route/event.routes'));
app.use('/patisserie', require('./Route/patisserie.routes'));
app.use('/deliveries', require('./Route/delivery.routes'));
app.use('/verification', require('./Route/verification.routes'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
    });

    if (err.name === 'MulterError') {
        return res.status(400).json({
            message: 'File upload error',
            error: err.message
        });
    }
    res.status(500).json({ message: 'Something went wrong!' });
});

// Initialize database connection
let isConnected = false;

const connectToDatabase = async () => {
    if (isConnected) {
        console.log('Using existing database connection');
        return;
    }
    try {
        console.log('Attempting to connect to database...');
        await connectDB();
        isConnected = true;
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Database connection error:', {
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        database: isConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Export the Express app for serverless deployment
module.exports = async (req, res) => {
    try {
        console.log('Incoming request:', {
            method: req.method,
            path: req.path,
            timestamp: new Date().toISOString()
        });

        await connectToDatabase();
        return app(req, res);
    } catch (error) {
        console.error('Serverless function error:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
