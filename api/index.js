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

const routes = [
    { path: '/auth', file: '../Route/auth.routes.js' },
    { path: '/menu', file: '../Route/menu.routes.js' },
    { path: '/reservations', file: '../Route/reservation.routes.js' },
    { path: '/events', file: '../Route/event.routes.js' },
    { path: '/patisserie', file: '../Route/patisserie.routes.js' },
    { path: '/deliveries', file: '../Route/delivery.routes.js' },
    { path: '/verification', file: '../Route/verification.routes.js' }
];

console.log('Loading routes...');
// Load routes asynchronously
const loadRoutes = async () => {
    for (const route of routes) {
        try {
            const router = await import(route.file);
            app.use(route.path, router.default || router);
            console.log(`✔ Loaded ${route.path}`);
        } catch (err) {
            console.error(`❌ Failed to load ${route.path}:`, err.message);
        }
    }
};

// Initialize database connection and load routes before starting server
const startServer = async () => {
    try {
        console.log('Initializing database connection...');
        await connectDB();
        console.log('Database connection initialized successfully');

        // Load routes
        await loadRoutes();

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