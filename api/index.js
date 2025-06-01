const express = require('express');
const cors = require('cors');
const path = require('path');
const serverless = require('serverless-http');
const { connectDB, isConnected } = require('../db');
const mongoose = require('mongoose');

const app = express();

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());

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

// Health check
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to KM0 API', status: 'operational', version: '1.0.0' });
});
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// DB middleware
app.use(async (req, res, next) => {
    try {
        if (!isConnected()) {
            console.log('Connecting to database...');
            await connectDB();
            console.log('Database connected');
        }
        next();
    } catch (error) {
        console.error('DB error:', error);
        res.status(500).json({ message: 'Database connection error', error: error.message });
    }
});

// Routes under /api
const apiRouter = express.Router();

apiRouter.use('/auth', require('../Route/auth.routes'));
apiRouter.use('/menu', require('../Route/menu.routes'));
apiRouter.use('/reservations', require('../Route/reservation.routes'));
apiRouter.use('/events', require('../Route/event.routes'));
apiRouter.use('/patisserie', require('../Route/patisserie.routes'));
apiRouter.use('/deliveries', require('../Route/delivery.routes'));
apiRouter.use('/verification', require('../Route/verification.routes'));

app.use('/api', apiRouter);

// Error handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', {
        name: err.name,
        message: err.message,
        path: req.path,
        method: req.method,
        stack: err.stack
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

// 404 handler
app.use((req, res) => {
    if (req.path === '/favicon.ico') {
        return res.status(204).end();
    }
    console.log('404 Not Found:', {
        path: req.path,
        method: req.method
    });
    res.status(404).json({
        message: 'Not Found',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
        availableRoutes: [
            '/auth', '/menu', '/reservations', '/events', '/patisserie', '/deliveries', '/verification'
        ]
    });
});

// Only run local server in development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, async () => {
        await connectDB();
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

// Export for Vercel serverless
module.exports = app;
module.exports.handler = serverless(app);
