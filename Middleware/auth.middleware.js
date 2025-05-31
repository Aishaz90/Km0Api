const jwt = require('jsonwebtoken');
const User = require('../Model/user.model');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ message: 'Authorization header missing' });

    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ message: 'Token missing' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ message: 'Invalid token' });
    if (error.name === 'TokenExpiredError') return res.status(401).json({ message: 'Token expired' });
    res.status(500).json({ message: 'Authentication failed', error: error.message });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

module.exports = { auth, isAdmin };
