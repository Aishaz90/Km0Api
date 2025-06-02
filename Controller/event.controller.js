const Event = require('../Model/event.model');
const imgur = require('imgur');

// Configure Imgur
imgur.setClientId(process.env.IMGUR_CLIENT_ID);

// Create event
const createEvent = async (req, res) => {
    try {
        // Validate required fields
        const { title, description, date, location, price } = req.body;

        if (!title || !description || !date || !location || !price) {
            return res.status(400).json({
                message: 'Missing required fields',
                details: {
                    title: !title ? 'Title is required' : null,
                    description: !description ? 'Description is required' : null,
                    date: !date ? 'Date is required' : null,
                    location: !location ? 'Location is required' : null,
                    price: !price ? 'Price is required' : null
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

        const eventData = {
            title: title.trim(),
            description: description.trim(),
            date: new Date(date),
            location: location.trim(),
            price: priceNum,
            image: result.data.link,
            isActive: true
        };

        const event = new Event(eventData);
        await event.save();

        res.status(201).json({
            message: 'Event created successfully',
            event
        });
    } catch (error) {
        console.error('Create event error:', error);
        res.status(400).json({
            message: 'Error creating event',
            details: error.message
        });
    }
};

// Get all events
const getAllEvents = async (req, res) => {
    try {
        const { type, date, isAvailable } = req.query;
        const query = {};

        if (type) query.type = type;
        if (isAvailable !== undefined) {
            query.isAvailable = isAvailable === 'true';
        }
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            query.date = { $gte: startDate, $lt: endDate };
        }

        const events = await Event.find(query).sort({ date: 1, startTime: 1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching events', error: error.message });
    }
};

// Get event by ID
const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching event', error: error.message });
    }
};

// Update event
const updateEvent = async (req, res) => {
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

        const event = await Event.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        res.status(400).json({ message: 'Error updating event' });
    }
};

// Delete event
const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Note: Imgur doesn't provide a way to delete images via their API
        // The image will remain on Imgur's servers

        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Event deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting event' });
    }
};

module.exports = {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent
}; 