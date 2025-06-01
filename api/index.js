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
    { path: '/api/auth', file: path.join(__dirname, '../Route/auth.routes') },
    { path: '/api/menu', file: path.join(__dirname, '../Route/menu.routes') },
    { path: '/api/reservations', file: path.join(__dirname, '../Route/reservation.routes') },
    { path: '/api/events', file: path.join(__dirname, '../Route/event.routes') },
    { path: '/api/patisserie', file: path.join(__dirname, '../Route/patisserie.routes') },
    { path: '/api/deliveries', file: path.join(__dirname, '../Route/delivery.routes') },
    { path: '/api/verification', file: path.join(__dirname, '../Route/verification.routes') }
];

console.log('Loading routes...');
routes.forEach(route => {
    try {
        const router = require(route.file);
        app.use(route.path, router);
        console.log(`✔ Loaded ${route.path}`);
    } catch (err) {
        console.error(`❌ Failed to load ${route.path}:`, err.message);
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