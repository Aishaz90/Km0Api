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

// Import all models
const User = require('../Model/user.model');
const Menu = require('../Model/menu.model');
const Reservation = require('../Model/reservation.model');
const Event = require('../Model/event.model');
const Patisserie = require('../Model/patisserie.model');
const Delivery = require('../Model/delivery.model');
const { auth, isAdmin } = require('../Middleware/auth.middleware');
const upload = require('../Middleware/upload.middleware');

// Auth routes
app.post('/auth/register', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.post('/auth/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const user = await User.findOne({ refreshToken });
        if (!user) return res.status(401).json({ message: 'Invalid refresh token' });
        const token = user.generateAuthToken();
        res.json({ token });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.get('/auth/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Menu routes
app.get('/menu', async (req, res) => {
    try {
        const menuItems = await Menu.find({});
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/menu/:id', async (req, res) => {
    try {
        const menuItem = await Menu.findById(req.params.id);
        if (!menuItem) return res.status(404).json({ message: 'Menu item not found' });
        res.json(menuItem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/menu', auth, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const menuItem = new Menu({
            ...req.body,
            image: req.file ? req.file.path : undefined
        });
        await menuItem.save();
        res.status(201).json(menuItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.put('/menu/:id', auth, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const update = { ...req.body };
        if (req.file) update.image = req.file.path;
        const menuItem = await Menu.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!menuItem) return res.status(404).json({ message: 'Menu item not found' });
        res.json(menuItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete('/menu/:id', auth, isAdmin, async (req, res) => {
    try {
        const menuItem = await Menu.findByIdAndDelete(req.params.id);
        if (!menuItem) return res.status(404).json({ message: 'Menu item not found' });
        res.json({ message: 'Menu item deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Reservation routes
app.get('/reservations/all', auth, isAdmin, async (req, res) => {
    try {
        const reservations = await Reservation.find({}).populate('user', 'name email');
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ message: error.message });
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
        res.status(400).json({ message: error.message });
    }
});

app.get('/reservations/my-reservations', auth, async (req, res) => {
    try {
        const reservations = await Reservation.find({ user: req.user._id });
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/reservations/:id', auth, async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) return res.status(404).json({ message: 'Reservation not found' });
        if (reservation.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        res.json(reservation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/reservations/:id', auth, async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) return res.status(404).json({ message: 'Reservation not found' });
        if (reservation.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        Object.assign(reservation, req.body);
        await reservation.save();
        res.json(reservation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete('/reservations/:id', auth, async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) return res.status(404).json({ message: 'Reservation not found' });
        if (reservation.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        await reservation.remove();
        res.json({ message: 'Reservation deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Event routes
app.get('/events', async (req, res) => {
    try {
        const events = await Event.find({});
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/events/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/events', auth, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const event = new Event({
            ...req.body,
            image: req.file ? req.file.path : undefined
        });
        await event.save();
        res.status(201).json(event);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.put('/events/:id', auth, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const update = { ...req.body };
        if (req.file) update.image = req.file.path;
        const event = await Event.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json(event);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete('/events/:id', auth, isAdmin, async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json({ message: 'Event deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Patisserie routes
app.get('/patisserie', async (req, res) => {
    try {
        const patisserieItems = await Patisserie.find({});
        res.json(patisserieItems);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/patisserie/:id', async (req, res) => {
    try {
        const patisserieItem = await Patisserie.findById(req.params.id);
        if (!patisserieItem) return res.status(404).json({ message: 'Patisserie item not found' });
        res.json(patisserieItem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/patisserie', auth, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const patisserieItem = new Patisserie({
            ...req.body,
            image: req.file ? req.file.path : undefined
        });
        await patisserieItem.save();
        res.status(201).json(patisserieItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.put('/patisserie/:id', auth, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const update = { ...req.body };
        if (req.file) update.image = req.file.path;
        const patisserieItem = await Patisserie.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!patisserieItem) return res.status(404).json({ message: 'Patisserie item not found' });
        res.json(patisserieItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete('/patisserie/:id', auth, isAdmin, async (req, res) => {
    try {
        const patisserieItem = await Patisserie.findByIdAndDelete(req.params.id);
        if (!patisserieItem) return res.status(404).json({ message: 'Patisserie item not found' });
        res.json({ message: 'Patisserie item deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delivery routes
app.post('/deliveries', auth, async (req, res) => {
    try {
        const delivery = new Delivery({
            ...req.body,
            user: req.user._id
        });
        await delivery.save();
        res.status(201).json(delivery);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.get('/deliveries/my-deliveries', auth, async (req, res) => {
    try {
        const deliveries = await Delivery.find({ user: req.user._id });
        res.json(deliveries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/deliveries/:id', auth, async (req, res) => {
    try {
        const delivery = await Delivery.findById(req.params.id);
        if (!delivery) return res.status(404).json({ message: 'Delivery not found' });
        if (delivery.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        res.json(delivery);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/deliveries', auth, isAdmin, async (req, res) => {
    try {
        const deliveries = await Delivery.find({}).populate('user', 'name email');
        res.json(deliveries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/deliveries/:id/status', auth, isAdmin, async (req, res) => {
    try {
        const delivery = await Delivery.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        if (!delivery) return res.status(404).json({ message: 'Delivery not found' });
        res.json(delivery);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete('/deliveries/:id', auth, async (req, res) => {
    try {
        const delivery = await Delivery.findById(req.params.id);
        if (!delivery) return res.status(404).json({ message: 'Delivery not found' });
        if (delivery.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        await delivery.remove();
        res.json({ message: 'Delivery cancelled' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Verification routes
app.get('/verification/:reservationId', async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.reservationId);
        if (!reservation) return res.status(404).json({ message: 'Reservation not found' });
        res.json(reservation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/verification/verify/:reservationId', auth, isAdmin, async (req, res) => {
    try {
        const reservation = await Reservation.findByIdAndUpdate(
            req.params.reservationId,
            { verified: true },
            { new: true }
        );
        if (!reservation) return res.status(404).json({ message: 'Reservation not found' });
        res.json(reservation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

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