import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sport: { type: mongoose.Schema.Types.ObjectId, ref: 'Sport', required: true },
  date: { type: String, required: true },
  startTime: { type: Number, required: true },
  endTime: { type: Number, required: true },
  durationHours: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['pending_payment', 'confirmed', 'cancelled', 'completed', 'blocked'], default: 'pending_payment' },
  paymentMethod: { type: String, enum: ['jazzcash', 'easypaisa', 'bank_transfer'] },
  paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
  qrCode: { type: String },
  bookingReference: { type: String, unique: true, sparse: true },
  expiresAt: { type: Date }, // Added for 10 min timeout logic
  cancelledAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
