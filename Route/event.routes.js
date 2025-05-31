const express = require('express');
const router = express.Router();
const { createEvent, getAllEvents, getEventById, updateEvent, deleteEvent } = require('../Controller/event.controller');
const { auth, isAdmin } = require('../Middleware/auth.middleware');
const upload = require('../Middleware/upload.middleware');

// Public routes
router.get('/', getAllEvents);
router.get('/:id', getEventById);

// Protected routes (admin only)
router.post('/', auth, isAdmin, upload.single('image'), createEvent);
router.patch('/:id', auth, isAdmin, upload.single('image'), updateEvent);
router.delete('/:id', auth, isAdmin, deleteEvent);

module.exports = router; 