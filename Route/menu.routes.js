const express = require('express');
const router = express.Router();
const { createMenuItem, getAllMenuItems, getMenuItemById, updateMenuItem, deleteMenuItem } = require('../Controller/menu.controller');
const { auth, isAdmin } = require('../Middleware/auth.middleware');
const upload = require('../Middleware/upload.middleware');

// Public routes
router.get('/liste', getAllMenuItems);
router.get('/:id', getMenuItemById);

// Protected routes (admin only)
router.post('/', auth, isAdmin, upload.single('image'), createMenuItem);
router.patch('/:id', auth, isAdmin, upload.single('image'), updateMenuItem);
router.delete('/:id', auth, isAdmin, deleteMenuItem);

module.exports = router;                                      