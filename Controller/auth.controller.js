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
    const { name, email, password, phone } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = new User({ name, email, password, phone });
    await user.save();

    const tokens = generateTokens(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      ...tokens
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const tokens = generateTokens(user._id);

    res.json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      ...tokens
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
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
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
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

module.exports = { register, login, refreshToken, getProfile, updateProfile };
