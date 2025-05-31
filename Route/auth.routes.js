const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, refreshToken } = require('../Controller/auth.controller');
const { auth } = require('../Middleware/auth.middleware');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);

// Protected routes
router.get('/profile', auth, getProfile);
router.patch('/profile', auth, updateProfile);

module.exports = router; 