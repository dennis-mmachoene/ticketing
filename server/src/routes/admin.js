const express = require('express');
const User = require('../models/User');
const Event = require('../models/Event');
const Order = require('../models/Order');
const Ticket = require('../models/Ticket');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/stats
router.get('/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [totalUsers, totalEvents, totalOrders, revenueResult] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Order.countDocuments({ status: 'confirmed' }),
      Order.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    const eventsByStatus = await Event.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const recentOrders = await Order.find({ status: 'confirmed' })
      .populate('event', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalEvents,
        totalOrders,
        totalRevenue,
        usersByRole,
        eventsByStatus,
        recentOrders,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/users
router.get('/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: users.map(u => u.toSafeObject()),
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/users/:id/suspend
router.put('/users/:id/suspend', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: 'User suspended.', user: user.toSafeObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/users/:id/activate
router.put('/users/:id/activate', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    res.json({ success: true, message: 'User activated.', user: user.toSafeObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/events
router.get('/events', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Event.countDocuments(query);
    const events = await Event.find(query)
      .populate('organizer', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: events,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/events/:id/suspend
router.put('/events/:id/suspend', authenticate, authorize('admin'), async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, { status: 'suspended' }, { new: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    res.json({ success: true, message: 'Event suspended.', data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/events/:id/feature
router.put('/events/:id/feature', authenticate, authorize('admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    event.isFeatured = !event.isFeatured;
    await event.save();

    res.json({ success: true, data: event, message: `Event ${event.isFeatured ? 'featured' : 'unfeatured'}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
