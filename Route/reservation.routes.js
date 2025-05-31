const express = require('express');
const router = express.Router();
const { createReservation, getAllReservations, getUserReservations, getReservationById, updateReservation, deleteReservation } = require('../Controller/reservation.controller');
const { auth, isAdmin } = require('../Middleware/auth.middleware');

// Public routes
router.get('/all', auth, isAdmin, getAllReservations); // Admin route for all reservations

// Protected routes
router.post('/', auth, createReservation);
router.get('/my-reservations', auth, getUserReservations);
router.get('/:id', auth, getReservationById);
router.patch('/:id', auth, updateReservation);
router.delete('/:id', auth, deleteReservation);

module.exports = router; 