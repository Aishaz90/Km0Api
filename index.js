const express = require('express');
const cors = require('cors');
const path = require('path');
const serverless = require('serverless-http');
const { connectDB, isConnected } = require('./db');
const mongoose = require('mongoose');
const { auth, isAdmin } = require('./Middleware/auth.middleware');
const upload = require('./Middleware/upload.middleware');
const port = 5000;

// Import all controllers
const { register, login, refreshToken, getProfile, updateProfile, logout } = require('./Controller/auth.controller');
const { getAllMenu, getMenuById, createMenu, updateMenu, deleteMenu } = require('./Controller/menu.controller');
const {
    getAllPatisserieItems: getAllPatisserie,
    getPatisserieItemById: getPatisserieById,
    createPatisserieItem: createPatisserie,
    updatePatisserieItem: updatePatisserie,
    deletePatisserieItem: deletePatisserie
} = require('./Controller/patisserie.controller');
const { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent } = require('./Controller/event.controller');
const {
    getAllReservations,
    getUserReservations: getMyReservations,
    getReservationById,
    createReservation,
    updateReservation,
    deleteReservation
} = require('./Controller/reservation.controller');
const {
    getAllDeliveries,
    getUserDeliveries: getMyDeliveries,
    getDeliveryById,
    createDelivery,
    updateDelivery,
    deleteDelivery,
    updateDeliveryStatus
} = require('./Controller/delivery.controller');
const {
    verifyReservation,
    getVerificationPage: getVerification
} = require('./Controller/verification.controller');

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, '../images')));

// DB connection middleware
app.use(async (req, res, next) => {
    try {
        if (!isConnected()) {
            await connectDB();
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Database connection error' });
    }
});
app.get('/', (req, res) => { res.json({ message: 'Welcome to KM0 API' }) })
// Auth routes
app.post('/auth/register', register);
app.post('/auth/login', login);
app.post('/auth/refresh-token', refreshToken);
app.post('/auth/logout', auth, logout);
app.get('/auth/profile', auth, getProfile);
app.put('/auth/profile', auth, updateProfile);

// Menu routes
app.get('/menu', getAllMenu);
app.get('/menu/:id', getMenuById);
app.post('/menu', auth, isAdmin, upload.single('image'), createMenu);
app.put('/menu/:id', auth, isAdmin, upload.single('image'), updateMenu);
app.delete('/menu/:id', auth, isAdmin, deleteMenu);

// Patisserie routes
app.get('/patisserie', getAllPatisserie);
app.get('/patisserie/:id', getPatisserieById);
app.post('/patisserie', auth, isAdmin, upload.single('image'), createPatisserie);
app.put('/patisserie/:id', auth, isAdmin, upload.single('image'), updatePatisserie);
app.delete('/patisserie/:id', auth, isAdmin, deletePatisserie);

// Event routes
app.get('/events', getAllEvents);
app.get('/events/:id', getEventById);
app.post('/events', auth, isAdmin, upload.single('image'), createEvent);
app.put('/events/:id', auth, isAdmin, upload.single('image'), updateEvent);
app.delete('/events/:id', auth, isAdmin, deleteEvent);

// Reservation routes
app.get('/reservations', auth, isAdmin, getAllReservations);
app.get('/reservations/my-reservations', auth, getMyReservations);
app.get('/reservations/:id', auth, getReservationById);
app.post('/reservations', auth, createReservation);
app.put('/reservations/:id', auth, updateReservation);
app.delete('/reservations/:id', auth, deleteReservation);

// Delivery routes
app.get('/deliveries', auth, isAdmin, getAllDeliveries);
app.get('/deliveries/my-deliveries', auth, getMyDeliveries);
app.get('/deliveries/:id', auth, getDeliveryById);
app.post('/deliveries', auth, createDelivery);
app.put('/deliveries/:id', auth, updateDelivery);
app.put('/deliveries/:id/status', auth, isAdmin, updateDeliveryStatus);
app.delete('/deliveries/:id', auth, deleteDelivery);

// Verification routes
app.get('/verification/:reservationId', getVerification);
app.post('/verification/verify/:reservationId', auth, isAdmin, verifyReservation);

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    if (err.name === 'MulterError') {
        return res.status(400).json({ message: 'File upload error' });
    }
    res.status(500).json({ message: 'Server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Not Found' });
});
app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
}); 