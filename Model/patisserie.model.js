const mongoose = require('mongoose');

const patisserieSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    imageH: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    categorie: {
        type: String,
        required: true,
        enum: ['Boulangerie', 'Viennoiserie', 'Glaces', 'Patissier', 'Sales', 'Gourmandes']
    },
    quantity: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

const Patisserie = mongoose.model('patisserie', patisserieSchema);
module.exports = Patisserie; 