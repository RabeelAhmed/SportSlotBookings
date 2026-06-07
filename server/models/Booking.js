import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user:             { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sport:            { type: mongoose.Schema.Types.ObjectId, ref: 'Sport', required: true },
  date:             { type: String, required: true },
  startTime:        { type: Number, required: true },
  endTime:          { type: Number, required: true },
  durationHours:    { type: Number, required: true },
  totalPrice:       { type: Number, required: true },
  status:           { type: String, enum: ['pending_payment', 'confirmed', 'cancelled', 'completed', 'blocked'], default: 'pending_payment' },
  paymentMethod:    { type: String, enum: ['jazzcash', 'easypaisa', 'stripe_card'] },
  paymentStatus:    { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
  // QR fields
  qrCode:           { type: String },   // base64 PNG
  qrPayload:        { type: String },   // raw JSON string encoded in QR
  // Stripe fields
  stripeSessionId:      { type: String },
  stripePaymentIntent:  { type: String },
  // Timestamps
  bookingReference: { type: String, unique: true, sparse: true },
  expiresAt:        { type: Date },
  confirmedAt:      { type: Date },
  cancelledAt:      { type: Date },
  createdAt:        { type: Date, default: Date.now },
  // Check-in tracking
  checkedIn:        { type: Boolean, default: false },
  checkedInAt:      { type: Date },
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;

