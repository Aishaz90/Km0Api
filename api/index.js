const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB, isConnected } = require('../db');

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/images', express.static(path.join(__dirname, '../images')));

// Database connection middleware
app.use(async (req, res, next) => {
    if (!isConnected()) {
        try {
            await connectDB();
        } catch (error) {
            return res.status(500).json({
                message: 'Database connection error',
                error: error.message
            });
        }
    }
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

// Export the Express app as a serverless function
module.exports = app; 