const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const Reservation = require('../Model/reservation.model');

// Create email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Generate QR code
const generateQRCode = async (reservationId) => {
    try {
        const qrCodeDataUrl = await QRCode.toDataURL(reservationId);
        return qrCodeDataUrl;
    } catch (error) {
        throw new Error('Error generating QR code');
    }
};

// Send confirmation email with QR code
const sendConfirmationEmail = async (reservation, qrCodeDataUrl) => {
    try {
        // Ensure we have the user data populated
        const populatedReservation = await Reservation.findById(reservation._id).populate('user', 'name email');

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: populatedReservation.contactEmail,
            subject: 'Reservation Confirmation - KM0 Restaurant',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #333;">Reservation Confirmation</h1>
                    <p>Dear ${populatedReservation.firstName} ${populatedReservation.lastName},</p>
                    <p>Your reservation has been confirmed:</p>
                    <ul style="list-style: none; padding: 0;">
                        <li style="margin: 10px 0;"><strong>Type:</strong> ${populatedReservation.type}</li>
                        ${populatedReservation.type === 'event' ? `<li style="margin: 10px 0;"><strong>Event Type:</strong> ${populatedReservation.eventType}</li>` : ''}
                        <li style="margin: 10px 0;"><strong>Date:</strong> ${new Date(populatedReservation.date).toLocaleDateString()}</li>
                        <li style="margin: 10px 0;"><strong>Time:</strong> ${populatedReservation.time}</li>
                        <li style="margin: 10px 0;"><strong>Number of Guests:</strong> ${populatedReservation.numberOfGuests}</li>
                    </ul>
                    <p>Please present this QR code upon arrival:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <img src="${qrCodeDataUrl}" alt="Reservation QR Code" style="max-width: 200px;"/>
                    </div>
                    <p>Thank you for choosing KM0 restaurant cafe!</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Confirmation email sent successfully to:', populatedReservation.contactEmail);
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        // Don't throw the error, just log it so the reservation can still be created
        // But we'll return false to indicate the email wasn't sent
        return false;
    }
    return true;
};

// Create reservation
const createReservation = async (req, res) => {
    try {
        // Validate required fields
        const requiredFields = ['firstName', 'lastName', 'type', 'date', 'time', 'numberOfGuests', 'contactPhone', 'contactEmail'];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                message: 'Missing required fields',
                missingFields
            });
        }

        // If type is event, validate eventType
        if (req.body.type === 'event' && !req.body.eventType) {
            return res.status(400).json({
                message: 'Event type is required for event reservations'
            });
        }

        const reservation = new Reservation({
            ...req.body,
            user: req.user._id
        });

        await reservation.save();

        // Generate QR code
        const qrCodeDataUrl = await generateQRCode(reservation._id.toString());
        reservation.qrCode = qrCodeDataUrl;
        await reservation.save();

        // Send confirmation email
        const emailSent = await sendConfirmationEmail(reservation, qrCodeDataUrl);

        res.status(201).json({
            ...reservation.toObject(),
            emailSent
        });
    } catch (error) {
        console.error('Reservation creation error:', error);
        res.status(400).json({
            message: 'Error creating reservation',
            error: error.message
        });
    }
};

// Get all reservations (admin only)
const getAllReservations = async (req, res) => {
    try {
        const { type, status, date } = req.query;
        const query = {};

        if (type) query.type = type;
        if (status) query.status = status;
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            query.date = { $gte: startDate, $lt: endDate };
        }

        const reservations = await Reservation.find(query)
            .populate('user', 'name email')
            .sort({ date: 1, time: 1 });
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reservations', error: error.message });
    }
};

// Get user's reservations
const getUserReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find({ user: req.user._id })
            .sort({ date: 1, time: 1 });
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user reservations', error: error.message });
    }
};

// Get reservation by ID
const getReservationById = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id)
            .populate('user', 'name email');

        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        // Check if user is authorized to view this reservation
        if (reservation.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view this reservation' });
        }

        res.json(reservation);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reservation', error: error.message });
    }
};

// Update reservation
const updateReservation = async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['date', 'time', 'numberOfGuests', 'status', 'specialRequests'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).json({ message: 'Invalid updates' });
    }

    try {
        const reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        // Check if user is authorized to update this reservation
        if (reservation.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this reservation' });
        }

        updates.forEach(update => reservation[update] = req.body[update]);
        await reservation.save();

        // If status is updated to confirmed, send confirmation email
        if (updates.includes('status') && reservation.status === 'confirmed') {
            const qrCodeDataUrl = await generateQRCode(reservation._id.toString());
            reservation.qrCode = qrCodeDataUrl;
            await reservation.save();
            await sendConfirmationEmail(reservation, qrCodeDataUrl);
        }

        res.json(reservation);
    } catch (error) {
        res.status(400).json({ message: 'Error updating reservation', error: error.message });
    }
};

// Delete reservation
const deleteReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        // Check if user is authorized to delete this reservation
        if (reservation.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this reservation' });
        }

        await Reservation.findByIdAndDelete(req.params.id);
        res.json({ message: 'Reservation deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting reservation', error: error.message });
    }
};

module.exports = {
    createReservation,
    getAllReservations,
    getUserReservations,
    getReservationById,
    updateReservation,
    deleteReservation
}; 