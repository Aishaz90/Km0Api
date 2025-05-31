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

const PORT = process.env.PORT || 5000;

// Start server only after database connection is established
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
