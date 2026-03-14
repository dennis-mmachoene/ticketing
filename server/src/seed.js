require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Event = require('./models/Event');
const Order = require('./models/Order');
const Ticket = require('./models/Ticket');
const connectDB = require('./config/database');
const slugify = require('slugify');
const { v4: uuidv4 } = require('uuid');

const seed = async () => {
  await connectDB();
  console.log('Seeding database...');

  await User.deleteMany({});
  await Event.deleteMany({});
  await Order.deleteMany({});
  await Ticket.deleteMany({});

  // Create users
  const admin = await User.create({
    name: 'Platform Admin',
    email: 'admin@demo.com',
    password: 'admin123',
    role: 'admin',
  });

  const organizer = await User.create({
    name: 'Alex Organizer',
    email: 'organizer@demo.com',
    password: 'demo123',
    role: 'organizer',
    organizationName: 'VaultEvents Co.',
  });

  const scanner = await User.create({
    name: 'Sam Scanner',
    email: 'scanner@demo.com',
    password: 'demo123',
    role: 'scanner',
  });

  const buyer = await User.create({
    name: 'Jordan Buyer',
    email: 'buyer@demo.com',
    password: 'demo123',
    role: 'attendee',
  });

  console.log('Users created');

  // Create events
  const events = [
    {
      name: 'Neon Pulse Electronic Festival 2025',
      description: 'A premier electronic music festival featuring world-class DJs across three stages. Expect immersive light installations, cutting-edge sound systems, and an unforgettable lineup spanning techno, house, and ambient sounds.',
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      time: '18:00',
      location: { venue: 'Grand Arena', address: '1 Arena Blvd', city: 'Cape Town', country: 'South Africa' },
      category: 'music',
      basePrice: 450,
      totalTickets: 500,
      status: 'published',
      isFeatured: true,
      tags: ['electronic', 'music', 'festival', 'nightlife'],
      aiDesignMetadata: {
        colorPalette: ['#0D0620', '#8B5CF6', '#EC4899'],
        fontStyle: 'Bold futuristic',
        layoutHint: 'Dark with neon accents',
      },
    },
    {
      name: 'DevSummit Africa 2025',
      description: 'The continent\'s largest developer conference. Three days of workshops, keynotes, and networking sessions covering AI, cloud infrastructure, web3, and modern software engineering practices.',
      date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      time: '08:00',
      location: { venue: 'Sandton Convention Centre', address: '161 Maude St', city: 'Johannesburg', country: 'South Africa' },
      category: 'technology',
      basePrice: 1200,
      totalTickets: 300,
      status: 'published',
      isFeatured: true,
      tags: ['tech', 'development', 'conference', 'AI'],
      aiDesignMetadata: {
        colorPalette: ['#020F1E', '#0EA5E9', '#38BDF8'],
        fontStyle: 'Clean technical sans-serif',
        layoutHint: 'Professional with blue accents',
      },
    },
    {
      name: 'Cape Town Comedy Nights',
      description: 'An evening of side-splitting stand-up comedy featuring South Africa\'s hottest comedians. Perfect for groups, dates, and anyone in need of a good laugh.',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      time: '20:00',
      location: { venue: 'The Laff Factory', address: '23 Loop St', city: 'Cape Town', country: 'South Africa' },
      category: 'comedy',
      basePrice: 180,
      totalTickets: 150,
      status: 'published',
      tags: ['comedy', 'standup', 'entertainment'],
      aiDesignMetadata: {
        colorPalette: ['#1A1500', '#D97706', '#FDE68A'],
        fontStyle: 'Playful bold',
        layoutHint: 'Warm amber tones',
      },
    },
    {
      name: 'African Art Collective Exhibition',
      description: 'A curated showcase of emerging and established African artists exploring identity, heritage, and contemporary life through painting, sculpture, and mixed media installations.',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      time: '10:00',
      location: { venue: 'Zeitz MOCAA', address: 'V&A Waterfront', city: 'Cape Town', country: 'South Africa' },
      category: 'arts',
      basePrice: 120,
      totalTickets: 200,
      status: 'published',
      tags: ['art', 'exhibition', 'culture', 'African'],
    },
    {
      name: 'Sunfoil Cricket Classic',
      description: 'High-octane T20 cricket action featuring provincial powerhouses. Expect boundary hitting, nail-biting finishes, and family-friendly entertainment throughout the day.',
      date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      time: '14:00',
      location: { venue: 'Newlands Cricket Ground', address: 'Campground Rd', city: 'Cape Town', country: 'South Africa' },
      category: 'sports',
      basePrice: 95,
      totalTickets: 800,
      status: 'published',
      tags: ['cricket', 'sports', 'T20'],
    },
  ];

  for (const eventData of events) {
    eventData.slug = slugify(eventData.name, { lower: true, strict: true }) + '-' + Date.now() + Math.random().toString(36).substr(2, 5);
    eventData.organizer = organizer._id;
    eventData.ticketTiers = [{
      name: 'General Admission',
      price: eventData.basePrice,
      quantity: Math.floor(eventData.totalTickets * 0.7),
      sold: 0,
    }, {
      name: 'VIP',
      price: eventData.basePrice * 2.5,
      quantity: Math.floor(eventData.totalTickets * 0.3),
      sold: 0,
    }];
    eventData.team = [{ user: scanner._id, role: 'scanner' }];
    await Event.create(eventData);
  }

  console.log('Events created');

  // Create some sample orders
  const publishedEvents = await Event.find({ status: 'published' }).limit(2);

  for (const event of publishedEvents) {
    const quantity = Math.floor(Math.random() * 5) + 2;
    const order = await Order.create({
      event: event._id,
      buyer: buyer._id,
      buyerDetails: { name: 'Jordan Buyer', email: 'buyer@demo.com', phone: '+27 82 555 1234' },
      quantity,
      tierName: 'General Admission',
      unitPrice: event.basePrice,
      totalAmount: event.basePrice * quantity,
      paymentStatus: 'completed',
      status: 'confirmed',
      emailSent: true,
    });

    const tickets = [];
    for (let i = 0; i < quantity; i++) {
      const ticket = await Ticket.create({
        event: event._id,
        order: order._id,
        holder: { name: 'Jordan Buyer', email: 'buyer@demo.com' },
        tierName: 'General Admission',
        price: event.basePrice,
      });
      tickets.push(ticket._id);
    }

    order.tickets = tickets;
    await order.save();

    await Event.findByIdAndUpdate(event._id, {
      $inc: { ticketsSold: quantity, totalRevenue: event.basePrice * quantity },
    });
  }

  console.log('Orders created');
  console.log('\n--- Demo Accounts ---');
  console.log('Admin:     admin@demo.com     / admin123');
  console.log('Organizer: organizer@demo.com / demo123');
  console.log('Scanner:   scanner@demo.com   / demo123');
  console.log('Buyer:     buyer@demo.com     / demo123');
  console.log('-------------------\n');

  await mongoose.disconnect();
  console.log('Seeding complete.');
};

seed().catch(console.error);
