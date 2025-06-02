const express = require('express');
const cors = require('cors');
const path = require('path');
const serverless = require('serverless-http');
const { connectDB, isConnected } = require('../db');
const mongoose = require('mongoose');
const { auth, isAdmin } = require('../Middleware/auth.middleware');
const multer = require('multer');

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

// Configure multer for memory storage (better for serverless)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
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
        res.status(500).json({ message: 'Database connection error' });
    }
});

// Add a test route to verify routing is working
app.get('/test-route', (req, res) => {
    res.json({ message: 'Test route is working' });
});

// Add a test menu route directly
app.get('/menu', async (req, res) => {
    try {
        const Menu = require('../Model/menu.model');
        const menuItems = await Menu.find({});
        res.json(menuItems);
    } catch (error) {
        console.error('Error in test-menu route:', error);
        res.status(500).json({ message: 'Error fetching menu items' });
    }
});

app.get('/menu/:id', async (req, res) => {
    try {
        const Menu = require('../Model/menu.model');
        const menuItem = await Menu.findById(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.json(menuItem);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching menu item' });
    }
});

app.post('/menu', auth, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const Menu = require('../Model/menu.model');

        // Create menu item with base64 image if provided
        const menuData = {
            ...req.body,
            image: req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : undefined
        };

        const menuItem = new Menu(menuData);
        await menuItem.save();
        res.status(201).json(menuItem);
    } catch (error) {
        console.error('Error creating menu item:', error);
        res.status(400).json({ message: 'Error creating menu item' });
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: 'File upload error' });
    }
    res.status(500).json({ message: 'Server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Not Found' });
});

// Create serverless handler
const handler = serverless(app, {
    basePath: '/api'
});

// Export for Vercel
module.exports = { handler };