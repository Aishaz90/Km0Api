const express = require('express');
const cors = require('cors');
const path = require('path');
const serverless = require('serverless-http');
const { connectDB, isConnected } = require('../db');
const mongoose = require('mongoose');

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log('Request headers:', req.headers);
    console.log('Request query:', req.query);
    console.log('Request body:', req.body);
    console.log('MongoDB connection state:', mongoose.connection.readyState);
    next();
});

// Serve static files
app.use('/images', express.static(path.join(__dirname, '../images')));

// Root and health check routes
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to KM0 API', status: 'operational', version: '1.0.0' });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// DB connection middleware
app.use(async (req, res, next) => {
    try {
        if (!isConnected()) {
            console.log('Connecting to database...');
            await connectDB();
            console.log('Database connected successfully');
        }
        next();
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ message: 'Database connection error', error: error.message });
    }
});

// Import all controllers
const { register, login, getProfile, updateProfile, refreshToken } = require('../Controller/auth.controller');
const { createMenuItem, getAllMenuItems, getMenuItemById, updateMenuItem, deleteMenuItem } = require('../Controller/menu.controller');
const { createReservation, getAllReservations, getUserReservations, getReservationById, updateReservation, deleteReservation } = require('../Controller/reservation.controller');
const { createEvent, getAllEvents, getEventById, updateEvent, deleteEvent } = require('../Controller/event.controller');
const { createPatisserieItem, getAllPatisserieItems, getPatisserieItemById, updatePatisserieItem, deletePatisserieItem } = require('../Controller/patisserie.controller');
const { createDelivery, getAllDeliveries, getUserDeliveries, getDeliveryById, updateDeliveryStatus, cancelDelivery } = require('../Controller/delivery.controller');
const { verifyReservation, getVerificationPage } = require('../Controller/verification.controller');

// Import middleware
const { auth, isAdmin } = require('../Middleware/auth.middleware');
const upload = require('../Middleware/upload.middleware');

// Auth routes
app.post('/auth/register', register);
app.post('/auth/refresh-token', refreshToken);
app.get('/auth/profile', auth, getProfile);

// Menu routes
app.get('/menu', getAllMenuItems);
app.get('/menu/:id', getMenuItemById);
app.post('/menu', auth, isAdmin, upload.single('image'), createMenuItem);
app.put('/menu/:id', auth, isAdmin, upload.single('image'), updateMenuItem);
app.delete('/menu/:id', auth, isAdmin, deleteMenuItem);

// Reservation routes
app.get('/reservations/all', auth, isAdmin, getAllReservations);
app.post('/reservations', auth, createReservation);
app.get('/reservations/my-reservations', auth, getUserReservations);
app.get('/reservations/:id', auth, getReservationById);
app.put('/reservations/:id', auth, updateReservation);
app.delete('/reservations/:id', auth, deleteReservation);

// Event routes
app.get('/events', getAllEvents);
app.get('/events/:id', getEventById);
app.post('/events', auth, isAdmin, upload.single('image'), createEvent);
app.put('/events/:id', auth, isAdmin, upload.single('image'), updateEvent);
app.delete('/events/:id', auth, isAdmin, deleteEvent);

// Patisserie routes
app.get('/patisserie', getAllPatisserieItems);
app.get('/patisserie/:id', getPatisserieItemById);
app.post('/patisserie', auth, isAdmin, upload.single('image'), createPatisserieItem);
app.put('/patisserie/:id', auth, isAdmin, upload.single('image'), updatePatisserieItem);
app.delete('/patisserie/:id', auth, isAdmin, deletePatisserieItem);

// Delivery routes
app.post('/deliveries', auth, createDelivery);
app.get('/deliveries/my-deliveries', auth, getUserDeliveries);
app.get('/deliveries/:id', auth, getDeliveryById);
app.get('/deliveries', auth, isAdmin, getAllDeliveries);
app.put('/deliveries/:id/status', auth, isAdmin, updateDeliveryStatus);
app.delete('/deliveries/:id', auth, cancelDelivery);

// Verification routes
app.get('/verification/:reservationId', getVerificationPage);
app.post('/verification/verify/:reservationId', auth, isAdmin, verifyReservation);

// Add a test route to verify routing is working
app.get('/test-route', (req, res) => {
    res.json({ message: 'Test route is working' });
});

// Add a test menu route directly
app.get('/test-menu', async (req, res) => {
    try {
        const Menu = require('../Model/menu.model');
        const menuItems = await Menu.find({});
        res.json(menuItems);
    } catch (error) {
        console.error('Error in test-menu route:', error);
        res.status(500).json({ message: 'Error fetching menu items', error: error.message });
    }
});

// Error and 404 handlers
app.use((err, req, res, next) => {
    console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    if (err.name === 'MulterError') {
        return res.status(400).json({ message: 'File upload error', error: err.message });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error', error: err.message });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token', error: err.message });
    }

    res.status(500).json({ message: 'Something went wrong!', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

app.use((req, res) => {
    if (req.path === '/favicon.ico') {
        res.status(204).end();
        return;
    }
    console.log('404 Not Found:', {
        path: req.path,
        method: req.method,
        availableRoutes: routes.map(r => r.path)
    });
    res.status(404).json({
        message: 'Not Found',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
        availableRoutes: routes.map(r => r.path)
    });
});

// Initialize database connection before starting server
const startServer = async () => {
    try {
        console.log('Initializing database connection...');
        await connectDB();
        console.log('Database connection initialized successfully');

        // Start server only if not in serverless environment
        if (process.env.NODE_ENV !== 'production') {
            const PORT = process.env.PORT || 3000;
            app.listen(PORT, () => {
                console.log(`Server is running on port ${PORT}`);
            });
        }
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

// Export the Express app as a serverless function
module.exports = app;
module.exports.handler = serverless(app);