const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../Model/user.model');

const generateTokens = (userId) => {
  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT secrets are not defined');
  }

  const accessToken = jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET, { expiresIn: '8h' });
  const refreshToken = jwt.sign({ id: userId.toString() }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

  return { accessToken, refreshToken };
};

const register = async (req, res) => {
  try {
    // Validate required fields
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Missing required fields',
        details: {
          name: !name ? 'Name is required' : null,
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null
        }
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'Registration failed',
        details: 'Email already registered'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password
    });

    await user.save();
    const token = user.generateAuthToken();

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      message: 'Error registering user',
      details: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = user.generateAuthToken();
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });

    const tokens = generateTokens(user._id);

    res.json({ message: 'Tokens refreshed', ...tokens });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ message: 'Invalid refresh token' });
    if (error.name === 'TokenExpiredError') return res.status(401).json({ message: 'Refresh token expired' });
    res.status(500).json({ message: 'Token refresh failed', error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

const updateProfile = async (req, res) => {
  const allowedUpdates = ['name', 'email', 'password', 'phone'];
  const updates = Object.keys(req.body);
  if (!updates.every(update => allowedUpdates.includes(update))) {
    return res.status(400).json({ message: 'Invalid update fields' });
  }

  try {
    updates.forEach(update => req.user[update] = req.body[update]);
    await req.user.save();
    res.json(req.user);
  } catch (error) {
    res.status(400).json({ message: 'Profile update failed', error: error.message });
  }
};

const logout = async (req, res) => {
  try {
    // Since we're using JWT tokens, we don't need to do anything server-side
    // The client should remove the token from their storage
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error during logout', error: error.message });
  }
};

module.exports = { register, login, refreshToken, getProfile, updateProfile, logout };
