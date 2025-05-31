const jwt = require('jsonwebtoken');
const User = require('../Model/user.model');

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');
        console.log('Auth header received:', authHeader);

        if (!authHeader) {
            console.log('No authorization header found');
            return res.status(401).json({ message: 'No authorization header' });
        }

        // Check if token exists and has correct format (case-insensitive)
        const token = authHeader.replace(/^bearer\s+/i, '');
        console.log('Token extracted:', token ? 'Token exists' : 'No token');

        if (!token) {
            console.log('No token found after Bearer prefix');
            return res.status(401).json({ message: 'No token provided' });
        }

        // Verify token
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not defined in environment variables');
            throw new Error('JWT_SECRET is not defined');
        }

        console.log('Attempting to verify token with JWT_SECRET');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded successfully:', decoded);

        // Find user
        const user = await User.findById(decoded.id);
        console.log('User found:', user ? 'Yes' : 'No');

        if (!user) {
            console.log('No user found for decoded token ID:', decoded.id);
            return res.status(401).json({ message: 'User not found' });
        }

        // Add user to request object
        req.user = user;
        req.token = token;
        console.log('Authentication successful for user:', user.email);
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        if (error.name === 'JsonWebTokenError') {
            console.log('JWT Error details:', error.message);
            return res.status(401).json({
                message: 'Invalid token',
                details: error.message
            });
        }
        if (error.name === 'TokenExpiredError') {
            console.log('Token expired at:', error.expiredAt);
            return res.status(401).json({
                message: 'Token expired',
                expiredAt: error.expiredAt
            });
        }
        res.status(500).json({
            message: 'Server error during authentication',
            error: error.message
        });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Admin access required' });
    }
};

module.exports = { auth, isAdmin }; 