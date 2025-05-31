require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db');

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
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

// Connect DB before export
(async () => {
    try {
        await connectDB();
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection failed:', error);
    }
})();

// ✅ Export the app instead of listening
module.exports = app;
