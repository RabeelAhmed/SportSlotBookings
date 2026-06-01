const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sport',
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  startTime: {
    type: Number,
    required: true,
  },
  endTime: {
    type: Number,
    required: true,
  },
  durationHours: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending_payment', 'confirmed', 'cancelled', 'completed'],
    default: 'pending_payment', // Set a sensible default if none provided
  },
  paymentMethod: {
    type: String,
    enum: ['jazzcash', 'easypaisa', 'bank_transfer'],
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid',
  },
  qrCode: {
    type: String,
  },
  bookingReference: {
    type: String,
    unique: true,
  },
  cancelledAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Booking', bookingSchema);
