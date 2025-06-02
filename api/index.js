const express = require('express');
const cors = require('cors');
const path = require('path');
const serverless = require('serverless-http');
const { connectDB, isConnected } = require('../db');
const mongoose = require('mongoose');
const { auth, isAdmin } = require('../Middleware/auth.middleware');
const upload = require('../Middleware/upload.middleware');

// Import controllers
const {
    getAllArticles,
    getArticleById,
    createArticle,
    updateArticle,
    deleteArticle
} = require('../Controller/article.controller');

const {
    getAllMenu,
    getMenuById,
    createMenu,
    updateMenu,
    deleteMenu
} = require('../Controller/menu.controller');

const {
    register,
    login,
    getProfile
} = require('../Controller/auth.controller');

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, '../images')));

// DB connection middleware
app.use(async (req, res, next) => {
    try {
        if (!isConnected()) {
            await connectDB();
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Database connection error' });
    }
});

// Article routes
app.get('/articles', getAllArticles);
app.get('/articles/:id', getArticleById);
app.post('/articles', auth, isAdmin, upload.single('image'), createArticle);
app.put('/articles/:id', auth, isAdmin, upload.single('image'), updateArticle);
app.delete('/articles/:id', auth, isAdmin, deleteArticle);

// Menu routes
app.get('/menu', getAllMenu);
app.get('/menu/:id', getMenuById);
app.post('/menu', auth, isAdmin, upload.single('image'), createMenu);
app.put('/menu/:id', auth, isAdmin, upload.single('image'), updateMenu);
app.delete('/menu/:id', auth, isAdmin, deleteMenu);

// Auth routes
app.post('/auth/register', register);
app.post('/auth/login', login);
app.get('/auth/profile', auth, getProfile);

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    if (err.name === 'MulterError') {
        return res.status(400).json({ message: 'File upload error' });
    }
    res.status(500).json({ message: 'Server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Not Found' });
});

// Export for Vercel
module.exports = app;
module.exports.handler = serverless(app);