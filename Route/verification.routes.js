const express = require('express');
const router = express.Router();
const { verifyReservation, getVerificationPage } = require('../Controller/verification.controller');
const { auth, isAdmin } = require('../Middleware/auth.middleware');

// Public routes (for QR code scanning)
router.get('/:reservationId', getVerificationPage);

// Protected routes (admin only)
router.post('/verify/:reservationId', auth, isAdmin, verifyReservation);

module.exports = router; 