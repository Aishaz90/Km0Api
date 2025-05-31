const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('../db'); // Adjust path if needed

require('dotenv').config();

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, '../images')));

app.use('/auth', require('../Route/auth.routes'));
app.use('/menu', require('../Route/menu.routes'));
app.use('/reservations', require('../Route/reservation.routes'));
app.use('/events', require('../Route/event.routes'));
app.use('/patisserie', require('../Route/patisserie.routes'));
app.use('/deliveries', require('../Route/delivery.routes'));
app.use('/verification', require('../Route/verification.routes'));

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Connect DB before exporting
(async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('DB Connection Error:', err);
    }
})();

// ✅ Export the Express app
module.exports = app;
