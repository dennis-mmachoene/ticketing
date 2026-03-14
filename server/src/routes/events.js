const express = require('express');
const multer = require('multer');
const path = require('path');
const slugify = require('slugify');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const Order = require('../models/Order');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { generateAITicketDesign } = require('../services/aiDesignService');
const { uploadPoster, deleteAsset } = require('../services/cloudinaryService');

const router = express.Router();

// Store files in memory so we can pass the buffer to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// GET /api/events - Public event listing
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { search, category, city, page = 1, limit = 12, featured } = req.query;
    const query = { status: 'published' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) query.category = category;
    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    if (featured === 'true') query.isFeatured = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Event.countDocuments(query);
    const events = await Event.find(query)
      .populate('organizer', 'name organizationName')
      .select('-team -aiDesignMetadata')
      .sort({ date: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: events,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/events/:slug - Public event page
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const event = await Event.findOne({ slug: req.params.slug, status: 'published' })
      .populate('organizer', 'name organizationName');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/events - Create event
router.post('/', authenticate, authorize('organizer', 'admin'), upload.single('poster'), async (req, res) => {
  try {
    const {
      name, description, date, endDate, time,
      venue, address, city, country,
      category, basePrice, totalTickets, tags,
    } = req.body;

    const slug = slugify(name, { lower: true, strict: true }) + '-' + Date.now();

    const eventData = {
      name,
      slug,
      description,
      date: new Date(date),
      time,
      location: { venue, address: address || '', city, country: country || '' },
      category,
      basePrice: parseFloat(basePrice),
      totalTickets: parseInt(totalTickets),
      organizer: req.user._id,
      status: 'draft',
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
    };

    if (endDate) eventData.endDate = new Date(endDate);
    if (req.file) {
      const { url } = await uploadPoster(req.file.buffer, slug);
      eventData.poster = url;
    }

    // Parse ticket tiers if provided
    if (req.body.ticketTiers) {
      try {
        eventData.ticketTiers = JSON.parse(req.body.ticketTiers);
      } catch {
        eventData.ticketTiers = [{
          name: 'General Admission',
          price: parseFloat(basePrice),
          quantity: parseInt(totalTickets),
          sold: 0,
        }];
      }
    } else {
      eventData.ticketTiers = [{
        name: 'General Admission',
        price: parseFloat(basePrice),
        quantity: parseInt(totalTickets),
        sold: 0,
      }];
    }

    const event = await Event.create(eventData);

    // Generate AI design async
    generateAITicketDesign(event).then(async (design) => {
      await Event.findByIdAndUpdate(event._id, { aiDesignMetadata: design });
    }).catch(console.error);

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/events/:id - Update event
router.put('/:id', authenticate, authorize('organizer', 'admin', 'event_manager'), upload.single('poster'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    const isOwner = event.organizer.toString() === req.user._id.toString();
    const isTeamMember = event.team.some(t => t.user.toString() === req.user._id.toString());
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isTeamMember && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const updates = { ...req.body };
    if (req.file) {
      // Delete old poster from Cloudinary if it exists
      if (event.poster && event.poster.includes('cloudinary')) {
        const publicId = event.poster.split('/').slice(-2).join('/').replace(/\.[^.]+$/, '');
        await deleteAsset(publicId, 'image').catch(() => {});
      }
      const { url } = await uploadPoster(req.file.buffer, req.params.id);
      updates.poster = url;
    }
    if (updates.date) updates.date = new Date(updates.date);
    if (updates.basePrice) updates.basePrice = parseFloat(updates.basePrice);
    if (updates.totalTickets) updates.totalTickets = parseInt(updates.totalTickets);

    delete updates.organizer;
    delete updates.ticketsSold;
    delete updates.totalRevenue;

    const updated = await Event.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/events/:id/publish
router.put('/:id/publish', authenticate, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    event.status = 'published';
    await event.save();

    res.json({ success: true, data: event, message: 'Event published successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/events/organizer/my-events
router.get('/organizer/my-events', authenticate, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/events/:id/team - Invite team member
router.post('/:id/team', authenticate, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const { email, role } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const User = require('../models/User');
    let member = await User.findOne({ email });

    if (!member) {
      const bcrypt = require('bcryptjs');
      member = await User.create({
        name: email.split('@')[0],
        email,
        password: 'TempPass123!',
        role: role || 'scanner',
      });
    } else {
      if (!['event_manager', 'scanner'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role for team member.' });
      }
      member.role = role;
      await member.save();
    }

    const alreadyInTeam = event.team.some(t => t.user.toString() === member._id.toString());
    if (!alreadyInTeam) {
      event.team.push({ user: member._id, role: role || 'scanner' });
      await event.save();
    }

    res.json({ success: true, message: 'Team member added.', member: member.toSafeObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/events/:id/analytics
router.get('/:id/analytics', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    const isAuthorized = event.organizer.toString() === req.user._id.toString() ||
      req.user.role === 'admin' ||
      event.team.some(t => t.user.toString() === req.user._id.toString());

    if (!isAuthorized) return res.status(403).json({ success: false, message: 'Access denied.' });

    // Sales by day (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const salesByDay = await Order.aggregate([
      {
        $match: {
          event: event._id,
          status: 'confirmed',
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          tickets: { $sum: '$quantity' },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const ticketsByTier = await Order.aggregate([
      { $match: { event: event._id, status: 'confirmed' } },
      { $group: { _id: '$tierName', count: { $sum: '$quantity' }, revenue: { $sum: '$totalAmount' } } },
    ]);

    res.json({
      success: true,
      data: {
        totalTicketsSold: event.ticketsSold,
        totalRevenue: event.totalRevenue,
        ticketsRemaining: event.totalTickets - event.ticketsSold,
        totalTickets: event.totalTickets,
        salesByDay,
        ticketsByTier,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;