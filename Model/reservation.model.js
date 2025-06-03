const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['table', 'event']
    },
    eventType: {
        type: String,
        enum: ['birthday', 'wedding', 'corporate', 'other'],
        required: function () {
            return this.type === 'event';
        }
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    numberOfGuests: {
        type: Number,
        required: true,
        min: 1
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    qrCode: {
        type: String
    },
    specialRequests: {
        type: String
    },
    contactPhone: {
        type: String,
        required: true
    },
    contactEmail: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationTime: {
        type: Date
    }
}, {
    timestamps: true
});

const Reservation = mongoose.model('reservations', reservationSchema);
module.exports = Reservation; 