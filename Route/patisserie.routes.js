const express = require('express');
const router = express.Router();
const { createPatisserieItem, getAllPatisserieItems, getPatisserieItemById, updatePatisserieItem, deletePatisserieItem } = require('../Controller/patisserie.controller');
const { auth, isAdmin } = require('../Middleware/auth.middleware');
const upload = require('../Middleware/upload.middleware');

// Public routes
router.get('/', getAllPatisserieItems);
router.get('/:id', getPatisserieItemById);

// Protected routes (admin only)
router.post('/', auth, isAdmin, upload.single('image'), createPatisserieItem);
router.patch('/:id', auth, isAdmin, upload.single('image'), updatePatisserieItem);
router.delete('/:id', auth, isAdmin, deletePatisserieItem);

module.exports = router; 