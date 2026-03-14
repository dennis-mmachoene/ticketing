const mongoose = require('mongoose');

const ticketTierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  sold: { type: Number, default: 0 },
  description: { type: String, default: '' },
});

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true,
    maxlength: [200, 'Event name cannot exceed 200 characters'],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters'],
  },
  date: {
    type: Date,
    required: [true, 'Event date is required'],
  },
  endDate: {
    type: Date,
    default: null,
  },
  time: {
    type: String,
    required: [true, 'Event time is required'],
  },
  location: {
    venue: { type: String, required: true },
    address: { type: String, default: '' },
    city: { type: String, required: true },
    country: { type: String, default: '' },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
  },
  category: {
    type: String,
    enum: ['music', 'sports', 'arts', 'technology', 'business', 'food', 'comedy', 'theatre', 'conference', 'other'],
    required: true,
  },
  poster: {
    type: String,
    default: null,
  },
  ticketTiers: [ticketTierSchema],
  totalTickets: {
    type: Number,
    required: true,
    min: 1,
  },
  ticketsSold: {
    type: Number,
    default: 0,
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  team: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['event_manager', 'scanner'] },
    invitedAt: { type: Date, default: Date.now },
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed', 'suspended'],
    default: 'draft',
  },
  aiDesignMetadata: {
    colorPalette: [String],
    fontStyle: String,
    layoutHint: String,
    generatedAt: Date,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  tags: [String],
  totalRevenue: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

eventSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    const slugify = require('slugify');
    this.slug = slugify(this.name, { lower: true, strict: true }) + '-' + Date.now();
  }
  next();
});

eventSchema.virtual('ticketsRemaining').get(function () {
  return this.totalTickets - this.ticketsSold;
});

eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
