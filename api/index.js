const express = require('express');
const cors = require('cors');
const path = require('path');
const serverless = require('serverless-http');
const { connectDB, isConnected } = require('../db');

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

// DB connection middleware with timeout
app.use(async (req, res, next) => {
    const timeout = setTimeout(() => {
        console.error('Database connection timeout');
        res.status(500).json({ message: 'Database connection timeout' });
    }, 5000);

    try {
        if (!isConnected()) {
            console.log('Connecting to database...');
            await connectDB();
            console.log('Database connected successfully');
        }
        clearTimeout(timeout);
        next();
    } catch (error) {
        clearTimeout(timeout);
        console.error('Database connection error:', error);
        res.status(500).json({ message: 'Database connection error', error: error.message });
    }
});

// Direct route loading
console.log('Loading routes...');

// Auth routes
const authRouter = require('../Route/auth.routes');
app.use('/auth', authRouter);
console.log('✔ Loaded /auth');

// Menu routes
const menuRouter = require('../Route/menu.routes');
app.use('/menu', menuRouter);
console.log('✔ Loaded /menu');

// Reservation routes
const reservationRouter = require('../Route/reservation.routes');
app.use('/reservations', reservationRouter);
console.log('✔ Loaded /reservations');

// Event routes
const eventRouter = require('../Route/event.routes');
app.use('/events', eventRouter);
console.log('✔ Loaded /events');

// Patisserie routes
const patisserieRouter = require('../Route/patisserie.routes');
app.use('/patisserie', patisserieRouter);
console.log('✔ Loaded /patisserie');

// Delivery routes
const deliveryRouter = require('../Route/delivery.routes');
app.use('/deliveries', deliveryRouter);
console.log('✔ Loaded /deliveries');

// Verification routes
const verificationRouter = require('../Route/verification.routes');
app.use('/verification', verificationRouter);
console.log('✔ Loaded /verification');

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
    res.status(404).json({
        message: 'Not Found',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
        availableRoutes: ['/auth', '/menu', '/reservations', '/events', '/patisserie', '/deliveries', '/verification']
    });
});

// Export the Express app as a serverless function
module.exports = app;
module.exports.handler = serverless(app);