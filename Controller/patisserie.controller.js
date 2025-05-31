const Patisserie = require('../Model/patisserie.model');

// Create patisserie item
const createPatisserieItem = async (req, res) => {
    try {
        const patisserieItem = new Patisserie({
            ...req.body,
            imageH: req.file ? `/images/patisserie/${req.file.filename}` : req.body.imageH,
            image: req.file ? `/images/patisserie/${req.file.filename}` : req.body.image
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
        const { categorie } = req.query;
        const query = {};

        if (categorie) {
            query.categorie = categorie;
        }

        const patisserieItems = await Patisserie.find(query);
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
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'imageH', 'image', 'categorie', 'quantity', 'price'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).json({ message: 'Invalid updates' });
    }

    try {
        const patisserieItem = await Patisserie.findById(req.params.id);
        if (!patisserieItem) {
            return res.status(404).json({ message: 'Patisserie item not found' });
        }

        updates.forEach(update => patisserieItem[update] = req.body[update]);

        // Update image if new file is uploaded
        if (req.file) {
            patisserieItem.image = `/images/patisserie/${req.file.filename}`;
            patisserieItem.imageH = `/images/patisserie/${req.file.filename}`;
        }

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
    createPatisserieItem,
    getAllPatisserieItems,
    getPatisserieItemById,
    updatePatisserieItem,
    deletePatisserieItem
}; 