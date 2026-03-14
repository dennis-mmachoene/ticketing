const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    default: () => 'ORD-' + uuidv4().split('-')[0].toUpperCase(),
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  buyerDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
  },
  tickets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
  }],
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  tierName: {
    type: String,
    default: 'General Admission',
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    default: 'demo',
  },
  paymentReference: {
    type: String,
    default: () => 'DEMO-' + uuidv4().split('-')[0].toUpperCase(),
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'refunded'],
    default: 'pending',
  },
  emailSent: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Order', orderSchema);
