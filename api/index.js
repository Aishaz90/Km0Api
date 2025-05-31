const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB, isConnected } = require('../db');

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve static files
app.use('/images', express.static(path.join(__dirname, '../images')));

// Root route
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to KM0 API',
        status: 'operational',
        version: '1.0.0'
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Database connection middleware
app.use(async (req, res, next) => {
    try {
        if (!isConnected()) {
            await connectDB();
        }
        next();
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({
            message: 'Database connection error',
            error: error.message
        });
    }
});

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/auth', require('../Route/auth.routes'));
app.use('/menu', require('../Route/menu.routes'));
app.use('/reservations', require('../Route/reservation.routes'));
app.use('/events', require('../Route/event.routes'));
app.use('/patisserie', require('../Route/patisserie.routes'));
app.use('/deliveries', require('../Route/delivery.routes'));
app.use('/verification', require('../Route/verification.routes'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    if (err.name === 'MulterError') {
        return res.status(400).json({
            message: 'File upload error',
            error: err.message
        });
    }

    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            message: 'Validation Error',
            error: err.message
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            message: 'Invalid token',
            error: err.message
        });
    }

    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Handle 404
app.use((req, res) => {
    // Don't send 404 for favicon.ico
    if (req.path === '/favicon.ico') {
        res.status(204).end();
        return;
    }
    res.status(404).json({
        message: 'Not Found',
        path: req.path,
        method: req.method
    });
});

// Export the Express app as a serverless function
module.exports = app; 