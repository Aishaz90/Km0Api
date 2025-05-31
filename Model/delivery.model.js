const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        patisserie: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patisserie',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        customization: [{
            name: String,
            price: Number
        }]
    }],
    deliveryAddress: {
        street: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        zipCode: {
            type: String,
            required: true
        }
    },
    deliveryDate: {
        type: Date,
        required: true
    },
    deliveryTime: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
        default: 'pending'
    },
    totalAmount: {
        type: Number,
        required: true
    },
    deliveryFee: {
        type: Number,
        required: true
    },
    specialInstructions: {
        type: String
    },
    contactPhone: {
        type: String,
        required: true
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'online'],
        required: true
    }
}, {
    timestamps: true
});

const Delivery = mongoose.model('deliveries', deliverySchema);
module.exports = Delivery; 