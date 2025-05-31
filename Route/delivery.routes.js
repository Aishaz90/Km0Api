const express = require('express');
const router = express.Router();
const { createDelivery, getAllDeliveries, getUserDeliveries, getDeliveryById, updateDeliveryStatus, cancelDelivery } = require('../Controller/delivery.controller');
const { auth, isAdmin } = require('../Middleware/auth.middleware');

// Protected routes
router.post('/', auth, createDelivery);
router.get('/my-deliveries', auth, getUserDeliveries);
router.get('/:id', auth, getDeliveryById);
router.post('/:id/cancel', auth, cancelDelivery);

// Admin only routes
router.get('/', auth, isAdmin, getAllDeliveries);
router.patch('/:id/status', auth, isAdmin, updateDeliveryStatus);

module.exports = router; 