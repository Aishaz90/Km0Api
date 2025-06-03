const Reservation = require('../Model/reservation.model');
const User = require('../Model/user.model');

// Verify reservation by QR code
const verifyReservation = async (req, res) => {
    try {
        const { reservationId } = req.params;
        const reservation = await Reservation.findById(reservationId);

        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        // Check if reservation is already verified
        if (reservation.isVerified) {
            return res.status(400).json({ message: 'Reservation already verified' });
        }

        // Check if reservation is for today
        const today = new Date();
        const reservationDate = new Date(reservation.date);
        if (reservationDate.toDateString() !== today.toDateString()) {
            return res.status(400).json({ message: 'Reservation is not for today' });
        }

        // Update reservation status
        reservation.isVerified = true;
        reservation.verificationTime = new Date();
        await reservation.save();

        res.json({
            message: 'Reservation verified successfully',
            reservation: {
                id: reservation._id,
                type: reservation.type,
                eventType: reservation.eventType,
                numberOfGuests: reservation.numberOfGuests,
                firstName: reservation.firstName,
                lastName: reservation.lastName,
                contactEmail: reservation.contactEmail
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying reservation', error: error.message });
    }
};

// Get verification page (mobile only)
const getVerificationPage = async (req, res) => {
    try {
        const { reservationId } = req.params;
        const reservation = await Reservation.findById(reservationId);

        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        // Check if user agent is mobile    
        const userAgent = req.headers['user-agent'];
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

        if (!isMobile) {
            return res.status(403).json({ message: 'Access denied. Mobile devices only.' });
        }

        res.json({
            reservation: {
                id: reservation._id,
                type: reservation.type,
                eventType: reservation.eventType,
                date: reservation.date,
                time: reservation.time,
                numberOfGuests: reservation.numberOfGuests,
                status: reservation.status,
                isVerified: reservation.isVerified,
                firstName: reservation.firstName,
                lastName: reservation.lastName,
                contactEmail: reservation.contactEmail
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching verification page', error: error.message });
    }
};

module.exports = {
    verifyReservation,
    getVerificationPage
}; 