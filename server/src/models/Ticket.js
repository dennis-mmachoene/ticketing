const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ticketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true,
    default: () => 'TKT-' + uuidv4().split('-')[0].toUpperCase() + '-' + uuidv4().split('-')[1].toUpperCase(),
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  holder: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
  },
  tierName: {
    type: String,
    default: 'General Admission',
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  validationToken: {
    type: String,
    unique: true,
    default: () => uuidv4(),
  },
  status: {
    type: String,
    enum: ['valid', 'used', 'cancelled', 'refunded'],
    default: 'valid',
  },
  usedAt: {
    type: Date,
    default: null,
  },
  scannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  qrCodeDataUrl: {
    type: String,
    default: null,
  },
  pdfPath: {
    type: String,
    default: null,
  },
  seatInfo: {
    section: { type: String, default: null },
    row: { type: String, default: null },
    seat: { type: String, default: null },
  },
  checkInNotes: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Ticket', ticketSchema);
