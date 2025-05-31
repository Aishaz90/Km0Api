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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./Route/auth.routes'));
app.use('/api/menu', require('./Route/menu.routes'));
app.use('/api/reservations', require('./Route/reservation.routes'));
app.use('/api/events', require('./Route/event.routes'));
app.use('/api/patisserie', require('./Route/patisserie.routes'));
app.use('/api/deliveries', require('./Route/delivery.routes'));
app.use('/api/verification', require('./Route/verification.routes'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
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
        return;
    }
    try {
        await connectDB();
        isConnected = true;
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
};

// Export the Express app for serverless deployment
module.exports = async (req, res) => {
    try {
        await connectToDatabase();
        return app(req, res);
    } catch (error) {
        console.error('Serverless function error:', error);
        return res.status(500).json({
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
