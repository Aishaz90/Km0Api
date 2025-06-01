const express = require('express');
const cors = require('cors');
const path = require('path');
const serverless = require('serverless-http');
const { connectDB, isConnected } = require('../db');
const mongoose = require('mongoose');
const { auth, isAdmin } = require('../Middleware/auth.middleware');
const upload = require('../Middleware/upload.middleware');

// Import models
const Menu = require('../Model/menu.model');
const User = require('../Model/user.model');
const Reservation = require('../Model/reservation.model');
const Event = require('../Model/event.model');
const Patisserie = require('../Model/patisserie.model');
const Delivery = require('../Model/delivery.model');

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

// Auth Routes
app.post('/auth/register', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        const token = await user.generateAuthToken();
        res.status(201).json({ user, token });
    } catch (error) {
        console.error('Register error:', error);
        res.status(400).json({ message: 'Error registering user', error: error.message });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.json({ user, token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ message: 'Invalid login credentials', error: error.message });
    }
});

// Menu Routes
app.get('/menu', async (req, res) => {
    try {
        const { category, isAvailable } = req.query;
        const query = {};
        if (category) query.category = category;
        if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';
        const menuItems = await Menu.find(query);
        res.json(menuItems);
    } catch (error) {
        console.error('Menu fetch error:', error);
        res.status(500).json({ message: 'Error fetching menu items', error: error.message });
    }
});

app.get('/menu/:id', async (req, res) => {
    try {
        const menuItem = await Menu.findById(req.params.id);
        if (!menuItem) return res.status(404).json({ message: 'Menu item not found' });
        res.json(menuItem);
    } catch (error) {
        console.error('Menu item fetch error:', error);
        res.status(500).json({ message: 'Error fetching menu item', error: error.message });
    }
});

app.post('/menu', auth, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const menuItem = new Menu(req.body);
        await menuItem.save();
        res.status(201).json(menuItem);
    } catch (error) {
        console.error('Menu creation error:', error);
        res.status(400).json({ message: 'Error creating menu item', error: error.message });
    }
});

app.patch('/menu/:id', auth, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const menuItem = await Menu.findById(req.params.id);
        if (!menuItem) return res.status(404).json({ message: 'Menu item not found' });
        Object.assign(menuItem, req.body);
        await menuItem.save();
        res.json(menuItem);
    } catch (error) {
        console.error('Menu update error:', error);
        res.status(400).json({ message: 'Error updating menu item', error: error.message });
    }
});

app.delete('/menu/:id', auth, isAdmin, async (req, res) => {
    try {
        const menuItem = await Menu.findByIdAndDelete(req.params.id);
        if (!menuItem) return res.status(404).json({ message: 'Menu item not found' });
        res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        console.error('Menu deletion error:', error);
        res.status(500).json({ message: 'Error deleting menu item', error: error.message });
    }
});

// Reservation Routes
app.get('/reservations', auth, async (req, res) => {
    try {
        const reservations = await Reservation.find({ user: req.user._id });
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reservations', error: error.message });
    }
});

app.post('/reservations', auth, async (req, res) => {
    try {
        const reservation = new Reservation({
            ...req.body,
            user: req.user._id
        });
        await reservation.save();
        res.status(201).json(reservation);
    } catch (error) {
        res.status(400).json({ message: 'Error creating reservation', error: error.message });
    }
});

// Event Routes
app.get('/events', async (req, res) => {
    try {
        const events = await Event.find();
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching events', error: error.message });
    }
});

app.post('/events', auth, isAdmin, async (req, res) => {
    try {
        const event = new Event(req.body);
        await event.save();
        res.status(201).json(event);
    } catch (error) {
        res.status(400).json({ message: 'Error creating event', error: error.message });
    }
});

// Patisserie Routes
app.get('/patisserie', async (req, res) => {
    try {
        const items = await Patisserie.find();
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching patisserie items', error: error.message });
    }
});

app.post('/patisserie', auth, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const item = new Patisserie(req.body);
        await item.save();
        res.status(201).json(item);
    } catch (error) {
        res.status(400).json({ message: 'Error creating patisserie item', error: error.message });
    }
});

// Delivery Routes
app.get('/deliveries', auth, async (req, res) => {
    try {
        const deliveries = await Delivery.find({ user: req.user._id });
        res.json(deliveries);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching deliveries', error: error.message });
    }
});

app.post('/deliveries', auth, async (req, res) => {
    try {
        const delivery = new Delivery({
            ...req.body,
            user: req.user._id
        });
        await delivery.save();
        res.status(201).json(delivery);
    } catch (error) {
        res.status(400).json({ message: 'Error creating delivery', error: error.message });
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
    res.status(404).json({
        message: 'Not Found',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Initialize database connection
const initializeApp = async () => {
    try {
        console.log('Initializing database connection...');
        await connectDB();
        console.log('Database connection initialized successfully');

        // Start local server if not in production
        if (process.env.NODE_ENV !== 'production') {
            const PORT = process.env.PORT || 3000;
            app.listen(PORT, () => {
                console.log(`🚀 Server is running on http://localhost:${PORT}`);
                console.log('Available routes:');
                console.log('GET  /');
                console.log('GET  /health');
                console.log('POST /auth/register');
                console.log('POST /auth/login');
                console.log('GET  /menu');
                console.log('GET  /menu/:id');
                console.log('POST /menu');
                console.log('PATCH /menu/:id');
                console.log('DELETE /menu/:id');
                console.log('GET  /reservations');
                console.log('POST /reservations');
                console.log('GET  /events');
                console.log('POST /events');
                console.log('GET  /patisserie');
                console.log('POST /patisserie');
                console.log('GET  /deliveries');
                console.log('POST /deliveries');
            });
        }
    } catch (error) {
        console.error('Failed to initialize app:', error);
        process.exit(1);
    }
};

// Initialize the app
initializeApp();

// Export the Express app as a serverless function
module.exports = app;
module.exports.handler = serverless(app);