const express = require('express');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// POST /api/scanner/validate
router.post('/validate', authenticate, authorize('organizer', 'admin', 'event_manager', 'scanner'), async (req, res) => {
  try {
    const { token, eventId } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Validation token is required.' });
    }

    const ticket = await Ticket.findOne({ validationToken: token })
      .populate('event', 'name date time location status organizer team');

    if (!ticket) {
      return res.status(200).json({
        success: true,
        result: 'INVALID',
        message: 'Ticket not found. QR code is invalid.',
        ticket: null,
      });
    }

    // Check scanner has access to this event
    const event = ticket.event;
    const hasAccess = req.user.role === 'admin' ||
      event.organizer.toString() === req.user._id.toString() ||
      event.team.some(t => t.user.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'You do not have access to scan tickets for this event.' });
    }

    if (ticket.status === 'used') {
      return res.status(200).json({
        success: true,
        result: 'ALREADY_USED',
        message: 'This ticket has already been used for entry.',
        ticket: {
          ticketId: ticket.ticketId,
          holderName: ticket.holder.name,
          holderEmail: ticket.holder.email,
          tierName: ticket.tierName,
          usedAt: ticket.usedAt,
          eventName: event.name,
        },
      });
    }

    if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
      return res.status(200).json({
        success: true,
        result: 'INVALID',
        message: `Ticket is ${ticket.status}.`,
        ticket: {
          ticketId: ticket.ticketId,
          holderName: ticket.holder.name,
          eventName: event.name,
        },
      });
    }

    // Mark as used
    ticket.status = 'used';
    ticket.usedAt = new Date();
    ticket.scannedBy = req.user._id;
    await ticket.save();

    return res.status(200).json({
      success: true,
      result: 'VALID',
      message: 'Ticket validated successfully. Entry granted.',
      ticket: {
        ticketId: ticket.ticketId,
        holderName: ticket.holder.name,
        holderEmail: ticket.holder.email,
        tierName: ticket.tierName,
        price: ticket.price,
        eventName: event.name,
        eventDate: event.date,
        eventLocation: event.location,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/scanner/events - Events available for scanning by current user
router.get('/events', authenticate, authorize('organizer', 'admin', 'event_manager', 'scanner'), async (req, res) => {
  try {
    let events;

    if (req.user.role === 'admin') {
      events = await Event.find({ status: 'published' }).select('name date time location poster slug');
    } else if (req.user.role === 'organizer') {
      events = await Event.find({
        organizer: req.user._id,
        status: { $in: ['published', 'completed'] },
      }).select('name date time location poster slug ticketsSold totalTickets');
    } else {
      events = await Event.find({
        'team.user': req.user._id,
        status: { $in: ['published', 'completed'] },
      }).select('name date time location poster slug');
    }

    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/scanner/events/:eventId/attendees
router.get('/events/:eventId/attendees', authenticate, authorize('organizer', 'admin', 'event_manager', 'scanner'), async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;

    const ticketQuery = { event: req.params.eventId };
    if (status) ticketQuery.status = status;
    if (search) {
      ticketQuery.$or = [
        { 'holder.name': { $regex: search, $options: 'i' } },
        { 'holder.email': { $regex: search, $options: 'i' } },
        { ticketId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Ticket.countDocuments(ticketQuery);
    const tickets = await Ticket.find(ticketQuery)
      .select('ticketId holder tierName status usedAt createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: tickets,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
