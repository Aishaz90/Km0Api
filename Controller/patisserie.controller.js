const Patisserie = require('../Model/patisserie.model');
const imgur = require('imgur');

// Configure Imgur
imgur.setClientId(process.env.IMGUR_CLIENT_ID);

// Create patisserie item
const createPatisserieItem = async (req, res) => {
    try {
        // Validate required fields
        const { name, description, price, categorie } = req.body;

        if (!name || !description || !price || !categorie) {
            return res.status(400).json({
                message: 'Missing required fields',
                details: {
                    name: !name ? 'Name is required' : null,
                    description: !description ? 'Description is required' : null,
                    price: !price ? 'Price is required' : null,
                    categorie: !categorie ? 'Category is required' : null
                }
            });
        }

        // Validate price
        const priceNum = Number(price);
        if (isNaN(priceNum) || priceNum < 0) {
            return res.status(400).json({
                message: 'Invalid price',
                details: 'Price must be a positive number'
            });
        }

        // Validate image
        if (!req.file) {
            return res.status(400).json({
                message: 'Image is required',
                details: 'Please upload an image file'
            });
        }

        // Upload image to Imgur
        const result = await imgur.uploadFile(req.file.path);
        if (!result || !result.data || !result.data.link) {
            throw new Error('Failed to upload image to Imgur');
        }

        const patisserieData = {
            name: name.trim(),
            description: description.trim(),
            price: priceNum,
            categorie,
            image: result.data.link,
            imageH: result.data.link,
            isAvailable: true,
            quantity: req.body.quantity || 0
        };

        const patisserieItem = new Patisserie(patisserieData);
        await patisserieItem.save();

        res.status(201).json({
            message: 'Patisserie item created successfully',
            patisserieItem
        });
    } catch (error) {
        console.error('Create patisserie error:', error);
        res.status(400).json({
            message: 'Error creating patisserie item',
            details: error.message
        });
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
    try {
        const update = { ...req.body };

        if (req.file) {
            // Upload new image to Imgur
            const result = await imgur.uploadFile(req.file.path);
            if (!result || !result.data || !result.data.link) {
                throw new Error('Failed to upload image to Imgur');
            }
            update.image = result.data.link;
            update.imageH = result.data.link;
        }

        const patisserieItem = await Patisserie.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!patisserieItem) {
            return res.status(404).json({ message: 'Patisserie item not found' });
        }
        res.json(patisserieItem);
    } catch (error) {
        res.status(400).json({ message: 'Error updating patisserie item' });
    }
};

// Delete patisserie item
const deletePatisserieItem = async (req, res) => {
    try {
        const patisserieItem = await Patisserie.findById(req.params.id);
        if (!patisserieItem) {
            return res.status(404).json({ message: 'Patisserie item not found' });
        }

        // Note: Imgur doesn't provide a way to delete images via their API
        // The image will remain on Imgur's servers

        await Patisserie.findByIdAndDelete(req.params.id);
        res.json({ message: 'Patisserie item deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting patisserie item' });
    }
};

module.exports = {
    createPatisserieItem,
    getAllPatisserieItems,
    getPatisserieItemById,
    updatePatisserieItem,
    deletePatisserieItem
}; 