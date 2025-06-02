const Menu = require('../Model/menu.model');
const imgur = require('imgur');

// Configure Imgur
imgur.setClientId(process.env.IMGUR_CLIENT_ID);

// Get all menu items
const getAllMenu = async (req, res) => {
    try {
        const menuItems = await Menu.find({});
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching menu items' });
    }
};

// Get menu item by ID
const getMenuById = async (req, res) => {
    try {
        const menuItem = await Menu.findById(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.json(menuItem);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching menu item' });
    }
};

// Create menu item
const createMenu = async (req, res) => {
    try {
        // Validate required fields
        const { name, description, price, category } = req.body;

        if (!name || !description || !price || !category) {
            return res.status(400).json({
                message: 'Missing required fields',
                details: {
                    name: !name ? 'Name is required' : null,
                    description: !description ? 'Description is required' : null,
                    price: !price ? 'Price is required' : null,
                    category: !category ? 'Category is required' : null
                }
            });
        }

        // Validate category
        const validCategories = ['appetizer', 'main', 'dessert', 'beverage'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                message: 'Invalid category',
                details: `Category must be one of: ${validCategories.join(', ')}`
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

        const menuData = {
            name: name.trim(),
            description: description.trim(),
            price: priceNum,
            category,
            image: result.data.link,
            isAvailable: true,
            ingredients: req.body.ingredients ? req.body.ingredients.split(',').map(i => i.trim()).filter(i => i) : []
        };

        const menuItem = new Menu(menuData);
        await menuItem.save();

        res.status(201).json({
            message: 'Menu item created successfully',
            menuItem
        });
    } catch (error) {
        console.error('Create menu error:', error);
        res.status(400).json({
            message: 'Error creating menu item',
            details: error.message
        });
    }
};

// Update menu item
const updateMenu = async (req, res) => {
    try {
        const update = { ...req.body };

        if (req.file) {
            // Upload new image to Imgur
            const result = await imgur.uploadFile(req.file.path);
            if (!result || !result.data || !result.data.link) {
                throw new Error('Failed to upload image to Imgur');
            }
            update.image = result.data.link;
        }

        const menuItem = await Menu.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.json(menuItem);
    } catch (error) {
        res.status(400).json({ message: 'Error updating menu item' });
    }
};

// Delete menu item
const deleteMenu = async (req, res) => {
    try {
        const menuItem = await Menu.findById(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        // Note: Imgur doesn't provide a way to delete images via their API
        // The image will remain on Imgur's servers

        await Menu.findByIdAndDelete(req.params.id);
        res.json({ message: 'Menu item deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting menu item' });
    }
};

module.exports = {
    getAllMenu,
    getMenuById,
    createMenu,
    updateMenu,
    deleteMenu
}; 