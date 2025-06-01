const express = require('express');
const router = express.Router();
const { createMenuItem, getAllMenuItems, getMenuItemById, updateMenuItem, deleteMenuItem } = require('../Controller/menu.controller');
const { auth, isAdmin } = require('../Middleware/auth.middleware');
const upload = require('../Middleware/upload.middleware');

// Debug middleware for menu routes
router.use((req, res, next) => {
    console.log(`[Menu Route] ${req.method} ${req.path}`);
    next();
});

// Public routes
router.get('/', async (req, res) => {
    console.log('GET /menu - Fetching all menu items');
    try {
        await getAllMenuItems(req, res);
    } catch (error) {
        console.error('Error in GET /menu:', error);
        res.status(500).json({ message: 'Error fetching menu items', error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    console.log(`GET /menu/${req.params.id} - Fetching menu item`);
    try {
        await getMenuItemById(req, res);
    } catch (error) {
        console.error(`Error in GET /menu/${req.params.id}:`, error);
        res.status(500).json({ message: 'Error fetching menu item', error: error.message });
    }
});

// Protected routes (admin only)
router.post('/', auth, isAdmin, upload.single('image'), async (req, res) => {
    console.log('POST /menu - Creating menu item');
    try {
        await createMenuItem(req, res);
    } catch (error) {
        console.error('Error in POST /menu:', error);
        res.status(500).json({ message: 'Error creating menu item', error: error.message });
    }
});

router.patch('/:id', auth, isAdmin, upload.single('image'), async (req, res) => {
    console.log(`PATCH /menu/${req.params.id} - Updating menu item`);
    try {
        await updateMenuItem(req, res);
    } catch (error) {
        console.error(`Error in PATCH /menu/${req.params.id}:`, error);
        res.status(500).json({ message: 'Error updating menu item', error: error.message });
    }
});

router.delete('/:id', auth, isAdmin, async (req, res) => {
    console.log(`DELETE /menu/${req.params.id} - Deleting menu item`);
    try {
        await deleteMenuItem(req, res);
    } catch (error) {
        console.error(`Error in DELETE /menu/${req.params.id}:`, error);
        res.status(500).json({ message: 'Error deleting menu item', error: error.message });
    }
});

module.exports = router;                                      