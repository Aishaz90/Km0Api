const Menu = require('../Model/menu.model');

// Get all menu items
exports.getAllMenu = async (req, res) => {
    try {
        const menuItems = await Menu.find({});
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching menu items' });
    }
};

// Get menu item by ID
exports.getMenuById = async (req, res) => {
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
exports.createMenu = async (req, res) => {
    try {
        const menuData = {
            ...req.body,
            image: req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : undefined
        };
        const menuItem = new Menu(menuData);
        await menuItem.save();
        res.status(201).json(menuItem);
    } catch (error) {
        res.status(400).json({ message: 'Error creating menu item' });
    }
};

// Update menu item
exports.updateMenu = async (req, res) => {
    try {
        const update = { ...req.body };
        if (req.file) {
            update.image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
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
exports.deleteMenu = async (req, res) => {
    try {
        const menuItem = await Menu.findByIdAndDelete(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
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