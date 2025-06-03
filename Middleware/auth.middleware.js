const jwt = require('jsonwebtoken');
const User = require('../Model/user.model');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const isVerifier = (req, res, next) => {
  if (req.user.role !== 'verifier' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Verifier access required' });
  }
  next();
};

module.exports = {
  auth,
  isAdmin,
  isVerifier
};
