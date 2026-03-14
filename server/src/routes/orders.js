const express = require('express');
const Event = require('../models/Event');
const Order = require('../models/Order');
const Ticket = require('../models/Ticket');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { generateTicketPDF } = require('../services/ticketService');
const { generateQRCode } = require('../services/qrService');
const { sendTicketEmail } = require('../services/emailService');

const router = express.Router();

// POST /api/orders - Purchase tickets
router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      eventId,
      quantity,
      tierName,
      buyerName,
      buyerEmail,
      buyerPhone,
      attendees,
    } = req.body;

    if (!eventId || !quantity || !buyerName || !buyerEmail) {
      return res.status(400).json({
        success: false,
        message: 'eventId, quantity, buyerName, and buyerEmail are required.',
      });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    if (event.status !== 'published') {
      return res.status(400).json({ success: false, message: 'This event is not accepting orders.' });
    }

    const remaining = event.totalTickets - event.ticketsSold;
    if (remaining < parseInt(quantity)) {
      return res.status(400).json({
        success: false,
        message: `Only ${remaining} ticket(s) remaining.`,
      });
    }

    // Find tier and price
    let tier = null;
    let unitPrice = event.basePrice;

    if (tierName && event.ticketTiers?.length > 0) {
      tier = event.ticketTiers.find(t => t.name === tierName);
      if (tier) {
        unitPrice = tier.price;
        if (tier.quantity - tier.sold < parseInt(quantity)) {
          return res.status(400).json({
            success: false,
            message: `Only ${tier.quantity - tier.sold} tickets left in this tier.`,
          });
        }
      }
    }

    const totalAmount = unitPrice * parseInt(quantity);
    const selectedTierName = tier?.name || 'General Admission';

    // Create order
    const order = await Order.create({
      event: event._id,
      buyer: req.user?._id || null,
      buyerDetails: { name: buyerName, email: buyerEmail, phone: buyerPhone || '' },
      quantity: parseInt(quantity),
      tierName: selectedTierName,
      unitPrice,
      totalAmount,
      paymentStatus: 'completed',
      status: 'confirmed',
    });

    // Create tickets
    const ticketPromises = [];
    for (let i = 0; i < parseInt(quantity); i++) {
      const attendee = attendees?.[i] || { name: buyerName, email: buyerEmail };
      ticketPromises.push(Ticket.create({
        event: event._id,
        order: order._id,
        holder: {
          name: attendee.name || buyerName,
          email: attendee.email || buyerEmail,
          phone: buyerPhone || '',
        },
        tierName: selectedTierName,
        price: unitPrice,
      }));
    }

    const tickets = await Promise.all(ticketPromises);

    // Generate QR codes for all tickets
    for (const ticket of tickets) {
      const qrDataUrl = await generateQRCode(ticket.validationToken);
      await Ticket.findByIdAndUpdate(ticket._id, { qrCodeDataUrl: qrDataUrl });
    }

    // Update order with ticket IDs
    order.tickets = tickets.map(t => t._id);
    await order.save();

    // Update event stats
    event.ticketsSold += parseInt(quantity);
    event.totalRevenue += totalAmount;
    if (tier) {
      const tierIndex = event.ticketTiers.findIndex(t => t.name === tierName);
      if (tierIndex >= 0) event.ticketTiers[tierIndex].sold += parseInt(quantity);
    }
    await event.save();

    // Generate PDFs and send email (async, non-blocking)
    const generateAndSend = async () => {
      try {
        const aiDesign = event.aiDesignMetadata;
        let lastBuffer = null;
        let lastCloudinaryUrl = null;

        for (const ticket of tickets) {
          const freshTicket = await Ticket.findById(ticket._id);
          const result = await generateTicketPDF(freshTicket, event, aiDesign);
          // Store the Cloudinary URL on the ticket
          await Ticket.findByIdAndUpdate(ticket._id, { pdfPath: result.cloudinaryUrl });
          lastBuffer = result.buffer;
          lastCloudinaryUrl = result.cloudinaryUrl;
        }

        // Send email with in-memory PDF buffer — no disk read needed
        const emailResult = await sendTicketEmail(
          order, tickets, event, lastBuffer, lastCloudinaryUrl
        );
        if (emailResult.success) {
          await Order.findByIdAndUpdate(order._id, { emailSent: true });
        }
      } catch (err) {
        console.error('PDF/Email generation error:', err.message);
      }
    };

    generateAndSend();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully. Tickets will be emailed shortly.',
      data: {
        order: {
          orderId: order.orderId,
          quantity: order.quantity,
          totalAmount: order.totalAmount,
          status: order.status,
        },
        tickets: tickets.map(t => ({
          ticketId: t.ticketId,
          holderName: t.holder.name,
          tierName: t.tierName,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/my-orders
router.get('/my-orders', authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate('event', 'name date time location poster slug')
      .populate('tickets', 'ticketId holder status tierName')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/:orderId - Get order details
router.get('/:orderId', authenticate, async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId })
      .populate('event', 'name date time location poster')
      .populate('tickets');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const isBuyer = order.buyer?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/ticket/:ticketId/download - Download ticket PDF
router.get('/ticket/:ticketId/download', async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId })
      .populate('event');

    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

    // pdfPath now holds the Cloudinary URL — redirect straight to it
    if (ticket.pdfPath && ticket.pdfPath.startsWith('http')) {
      return res.redirect(ticket.pdfPath);
    }

    // Fallback: regenerate and upload if URL is missing
    const event = ticket.event;
    const result = await generateTicketPDF(ticket, event, event.aiDesignMetadata);
    await Ticket.findByIdAndUpdate(ticket._id, { pdfPath: result.cloudinaryUrl });
    return res.redirect(result.cloudinaryUrl);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;