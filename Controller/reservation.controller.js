const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const Reservation = require('../Model/reservation.model');

// Create email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    },
    secure: true
});

// Verify transporter configuration
transporter.verify(function (error, success) {
    if (error) {
        console.error('Email configuration error:', {
            message: error.message,
            code: error.code,
            command: error.command,
            env: {
                username: process.env.MAIL_USERNAME,
                hasPassword: !!process.env.MAIL_PASSWORD
            }
        });
    } else {
        console.log('Email server is ready to send messages');
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
        console.log('Starting email sending process...');
        console.log('Environment variables check:', {
            MAIL_USERNAME: process.env.MAIL_USERNAME,
            hasPassword: !!process.env.MAIL_PASSWORD
        });

        if (!process.env.MAIL_USERNAME || !process.env.MAIL_PASSWORD) {
            console.error('Email configuration missing:', {
                hasMailUsername: !!process.env.MAIL_USERNAME,
                hasMailPassword: !!process.env.MAIL_PASSWORD
            });
            return false;
        }

        // Ensure we have the user data populated
        const populatedReservation = await Reservation.findById(reservation._id).populate('user', 'name email');
        console.log('Populated reservation:', {
            id: populatedReservation._id,
            contactEmail: populatedReservation.contactEmail,
            user: populatedReservation.user
        });

        if (!populatedReservation.contactEmail) {
            console.error('No contact email found for reservation:', reservation._id);
            return false;
        }

        console.log('Sending email to:', populatedReservation.contactEmail);

        const mailOptions = {
            from: process.env.MAIL_USERNAME,
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

        console.log('Attempting to send email with options:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject
        });

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.response);
        return true;
    } catch (error) {
        console.error('Detailed email sending error:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            command: error.command,
            env: {
                username: process.env.MAIL_USERNAME,
                hasPassword: !!process.env.MAIL_PASSWORD
            }
        });
        return false;
    }
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
            user: req.user._id,
            emailSent: false,
            message: 'Reservation created'
        });

        await reservation.save();
        console.log('Reservation saved successfully:', reservation._id);

        // Generate QR code
        const qrCodeDataUrl = await generateQRCode(reservation._id.toString());
        reservation.qrCode = qrCodeDataUrl;
        await reservation.save();
        console.log('QR code generated and saved');

        // Send confirmation email
        const emailSent = await sendConfirmationEmail(reservation, qrCodeDataUrl);
        console.log('Email sending result:', emailSent);

        // Update reservation with email status
        reservation.emailSent = emailSent;
        reservation.message = emailSent ? 'Reservation created and confirmation email sent' : 'Reservation created but email could not be sent';
        await reservation.save();

        res.status(201).json(reservation);
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