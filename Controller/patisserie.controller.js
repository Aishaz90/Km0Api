const Patisserie = require('../Model/patisserie.model');
const axios = require('axios');
const FormData = require('form-data');

// Create patisserie item
const createPatisserieItem = async (req, res) => {
    try {
        const { name, imageH, image, categorie, quantity, price } = req.body;

        const patisserieItem = new Patisserie({
            name,
            imageH,
            image,
            categorie,
            quantity,
            price
        });

        await patisserieItem.save();
        res.status(201).json(patisserieItem);
    } catch (error) {
        res.status(400).json({ message: 'Error creating patisserie item', error: error.message });
    }
};

// Get all patisserie items
const getAllPatisserieItems = async (req, res) => {
    try {
        const patisserieItems = await Patisserie.find();
        res.json(patisserieItems);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching patisserie items', error: error.message });
    }
};

// Get patisserie item by ID
const getPatisserieItemById = async (req, res) => {
    try {
        const patisserieItem = await Patisserie.findById(req.params.id);
        if (!patisserieItem) {
            return res.status(404).json({ message: 'Patisserie item not found' });
        }
        res.json(patisserieItem);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching patisserie item', error: error.message });
    }
};

// Update patisserie item
const updatePatisserieItem = async (req, res) => {
    try {
        const { name, imageH, image, categorie, quantity, price } = req.body;
        const patisserieItem = await Patisserie.findById(req.params.id);

        if (!patisserieItem) {
            return res.status(404).json({ message: 'Patisserie item not found' });
        }

        patisserieItem.name = name || patisserieItem.name;
        patisserieItem.imageH = imageH || patisserieItem.imageH;
        patisserieItem.image = image || patisserieItem.image;
        patisserieItem.categorie = categorie || patisserieItem.categorie;
        patisserieItem.quantity = quantity || patisserieItem.quantity;
        patisserieItem.price = price || patisserieItem.price;

        await patisserieItem.save();
        res.json(patisserieItem);
    } catch (error) {
        res.status(400).json({ message: 'Error updating patisserie item', error: error.message });
    }
};

// Delete patisserie item
const deletePatisserieItem = async (req, res) => {
    try {
        const patisserieItem = await Patisserie.findByIdAndDelete(req.params.id);
        if (!patisserieItem) {
            return res.status(404).json({ message: 'Patisserie item not found' });
        }
        res.json({ message: 'Patisserie item deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting patisserie item', error: error.message });
    }
};

module.exports = {
    getAllPatisserieItems,
    getPatisserieItemById,
    createPatisserieItem,
    updatePatisserieItem,
    deletePatisserieItem
}; 