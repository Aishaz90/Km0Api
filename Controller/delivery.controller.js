const Delivery = require('../Model/delivery.model');
const nodemailer = require('nodemailer');

// Create email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send delivery confirmation email
const sendDeliveryConfirmationEmail = async (delivery) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: delivery.user.email,
        subject: 'Delivery Confirmation',
        html: `
      <h1>Delivery Confirmation</h1>
      <p>Dear ${delivery.user.name},</p>
      <p>Your delivery has been confirmed:</p>
      <ul>
        <li>Delivery Date: ${new Date(delivery.deliveryDate).toLocaleDateString()}</li>
        <li>Delivery Time: ${delivery.deliveryTime}</li>
        <li>Total Amount: $${delivery.totalAmount}</li>
        <li>Delivery Fee: $${delivery.deliveryFee}</li>
      </ul>
      <p>Delivery Address:</p>
      <p>
        ${delivery.deliveryAddress.street}<br>
        ${delivery.deliveryAddress.city}, ${delivery.deliveryAddress.state} ${delivery.deliveryAddress.zipCode}
      </p>
      <p>Thank you for your order!</p>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        throw new Error('Error sending delivery confirmation email');
    }
};

// Create delivery
const createDelivery = async (req, res) => {
    try {
        // Validate required fields
        const requiredFields = [
            'items',
            'deliveryAddress',
            'deliveryDate',
            'deliveryTime',
            'totalAmount',
            'deliveryFee',
            'contactPhone',
            'paymentMethod'
        ];

        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                message: 'Missing required fields',
                missingFields
            });
        }

        // Validate items array
        if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
            return res.status(400).json({
                message: 'Items must be a non-empty array'
            });
        }

        // Validate each item
        for (const item of req.body.items) {
            if (!item.patisserie || !item.quantity) {
                return res.status(400).json({
                    message: 'Each item must have patisserie and quantity'
                });
            }
        }

        // Validate delivery address
        const addressFields = ['street', 'city', 'state', 'zipCode'];
        const missingAddressFields = addressFields.filter(field => !req.body.deliveryAddress[field]);
        if (missingAddressFields.length > 0) {
            return res.status(400).json({
                message: 'Missing required address fields',
                missingAddressFields
            });
        }

        // Validate payment method
        const validPaymentMethods = ['cash', 'card', 'online'];
        if (!validPaymentMethods.includes(req.body.paymentMethod)) {
            return res.status(400).json({
                message: 'Invalid payment method',
                validPaymentMethods
            });
        }

        const delivery = new Delivery({
            ...req.body,
            user: req.user._id,
            status: 'pending',
            isPaid: false
        });

        await delivery.save();

        // Send confirmation email
        try {
            await sendDeliveryConfirmationEmail(delivery);
        } catch (emailError) {
            console.error('Error sending confirmation email:', emailError);
            // Don't fail the delivery creation if email fails
        }

        res.status(201).json(delivery);
    } catch (error) {
        console.error('Delivery creation error:', error);
        res.status(400).json({
            message: 'Error creating delivery',
            error: error.message
        });
    }
};

// Get all deliveries (admin only)
const getAllDeliveries = async (req, res) => {
    try {
        const { status, date } = req.query;
        const query = {};

        if (status) query.status = status;
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            query.deliveryDate = { $gte: startDate, $lt: endDate };
        }

        const deliveries = await Delivery.find(query)
            .populate('user', 'name email')
            .populate('items.patisserie')
            .sort({ deliveryDate: 1, deliveryTime: 1 });
        res.json(deliveries);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching deliveries', error: error.message });
    }
};

// Get user's deliveries
const getUserDeliveries = async (req, res) => {
    try {
        const deliveries = await Delivery.find({ user: req.user._id })
            .populate('items.patisserie')
            .sort({ deliveryDate: 1, deliveryTime: 1 });
        res.json(deliveries);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user deliveries', error: error.message });
    }
};

// Get delivery by ID
const getDeliveryById = async (req, res) => {
    try {
        const delivery = await Delivery.findById(req.params.id)
            .populate('user', 'name email')
            .populate('items.patisserie');

        if (!delivery) {
            return res.status(404).json({ message: 'Delivery not found' });
        }

        // Check if user is authorized to view this delivery
        if (delivery.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view this delivery' });
        }

        res.json(delivery);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching delivery', error: error.message });
    }
};

// Update delivery
const updateDelivery = async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['deliveryDate', 'deliveryTime', 'deliveryAddress', 'items', 'specialInstructions'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).json({ message: 'Invalid updates' });
    }

    try {
        const delivery = await Delivery.findById(req.params.id);

        if (!delivery) {
            return res.status(404).json({ message: 'Delivery not found' });
        }

        // Check if user is authorized to update this delivery
        if (delivery.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this delivery' });
        }

        // Check if delivery can be updated
        if (['delivered', 'cancelled'].includes(delivery.status)) {
            return res.status(400).json({ message: 'Delivery cannot be updated' });
        }

        updates.forEach(update => delivery[update] = req.body[update]);
        await delivery.save();

        res.json(delivery);
    } catch (error) {
        res.status(400).json({ message: 'Error updating delivery', error: error.message });
    }
};

// Delete delivery
const deleteDelivery = async (req, res) => {
    try {
        const delivery = await Delivery.findById(req.params.id);

        if (!delivery) {
            return res.status(404).json({ message: 'Delivery not found' });
        }

        // Check if user is authorized to delete this delivery
        if (delivery.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this delivery' });
        }

        // Check if delivery can be deleted
        if (['delivered', 'cancelled'].includes(delivery.status)) {
            return res.status(400).json({ message: 'Delivery cannot be deleted' });
        }

        await delivery.remove();
        res.json({ message: 'Delivery deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting delivery', error: error.message });
    }
};

// Update delivery status
const updateDeliveryStatus = async (req, res) => {
    const { status } = req.body;
    const allowedStatuses = ['pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const delivery = await Delivery.findById(req.params.id)
            .populate('user', 'name email');

        if (!delivery) {
            return res.status(404).json({ message: 'Delivery not found' });
        }

        delivery.status = status;
        await delivery.save();

        // Send status update email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: delivery.user.email,
            subject: 'Delivery Status Update',
            html: `
        <h1>Delivery Status Update</h1>
        <p>Dear ${delivery.user.name},</p>
        <p>Your delivery status has been updated to: ${status}</p>
        <p>Delivery Details:</p>
        <ul>
          <li>Date: ${new Date(delivery.deliveryDate).toLocaleDateString()}</li>
          <li>Time: ${delivery.deliveryTime}</li>
          <li>Address: ${delivery.deliveryAddress.street}, ${delivery.deliveryAddress.city}</li>
        </ul>
      `
        };

        await transporter.sendMail(mailOptions);
        res.json(delivery);
    } catch (error) {
        res.status(400).json({ message: 'Error updating delivery status', error: error.message });
    }
};

// Cancel delivery
const cancelDelivery = async (req, res) => {
    try {
        const delivery = await Delivery.findById(req.params.id);

        if (!delivery) {
            return res.status(404).json({ message: 'Delivery not found' });
        }

        // Check if user is authorized to cancel this delivery
        if (delivery.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to cancel this delivery' });
        }

        // Check if delivery can be cancelled
        if (['delivered', 'cancelled'].includes(delivery.status)) {
            return res.status(400).json({ message: 'Delivery cannot be cancelled' });
        }

        delivery.status = 'cancelled';
        await delivery.save();

        // Send cancellation email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: delivery.user.email,
            subject: 'Delivery Cancelled',
            html: `
        <h1>Delivery Cancelled</h1>
        <p>Dear ${delivery.user.name},</p>
        <p>Your delivery has been cancelled.</p>
        <p>If you did not request this cancellation, please contact us immediately.</p>
      `
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'Delivery cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error cancelling delivery', error: error.message });
    }
};

module.exports = {
    createDelivery,
    getAllDeliveries,
    getUserDeliveries,
    getDeliveryById,
    updateDelivery,
    deleteDelivery,
    updateDeliveryStatus,
    cancelDelivery
}; 