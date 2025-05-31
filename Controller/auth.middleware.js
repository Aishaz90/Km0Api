const jwt = require('jsonwebtoken');
const User = require('../Model/user.model');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        console.log('Received token:', token); // Debug log

        if (!token) {
            console.log('No token provided'); // Debug log
            return res.status(401).json({ message: 'Please authenticate.' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded token:', decoded); // Debug log

            const user = await User.findOne({ _id: decoded.userId });
            console.log('Found user:', user ? 'Yes' : 'No'); // Debug log

            if (!user) {
                return res.status(401).json({ message: 'User not found.' });
            }

            req.user = user;
            req.token = token;
            next();
        } catch (error) {
            console.log('Token verification error:', error.message); // Debug log
            return res.status(401).json({ message: 'Invalid token.' });
        }
    } catch (error) {
        console.log('Auth middleware error:', error.message); // Debug log
        res.status(401).json({ message: 'Please authenticate.' });
    }
};

const adminAuth = async (req, res, next) => {
    try {
        await auth(req, res, () => {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Access denied. Admin only.' });
            }
            next();
        });
    } catch (error) {
        res.status(401).json({ message: 'Please authenticate.' });
    }
};

module.exports = {
    auth,
    adminAuth
}; 