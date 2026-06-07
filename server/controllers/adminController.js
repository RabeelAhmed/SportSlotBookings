import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { generateBookingQR } from '../utils/generateQR.js';
import { sendSMS } from '../utils/sms.js';

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res) => {
  try {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const todayBookings = await Booking.countDocuments({ date: todayStr });
    
    const todayRevenueAgg = await Booking.aggregate([
      { $match: { date: todayStr, status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const todayRevenue = todayRevenueAgg.length > 0 ? todayRevenueAgg[0].total : 0;

    const pendingPayments = await Booking.countDocuments({ status: 'pending_payment' });
    const totalUsers = await User.countDocuments();

    res.json({
      todayBookings,
      todayRevenue,
      pendingPayments,
      totalUsers
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all bookings with filters
// @route   GET /api/admin/bookings
// @access  Private/Admin
export const getAllBookings = async (req, res) => {
  try {
    const { sport, date, status } = req.query;
    
    let query = {};
    if (sport && sport !== 'All') query.sport = sport;
    if (date) query.date = date;
    if (status && status !== 'All') query.status = status;

    const bookings = await Booking.find(query)
      .populate('user', 'name phone')
      .populate('sport', 'name')
      .sort({ createdAt: -1 });
      
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Confirm payment and generate QR
// @route   PATCH /api/admin/bookings/:id/confirm-payment
// @access  Private/Admin
export const confirmPayment = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name phone')
      .populate('sport', 'name');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'pending_payment') {
      return res.status(400).json({ message: 'Booking is not pending payment' });
    }

    // Assign a booking reference if none exists
    if (!booking.bookingReference) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let ref = '';
      for (let i = 0; i < 8; i++) {
        ref += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      booking.bookingReference = ref;
    }

    booking.status        = 'confirmed';
    booking.paymentStatus = 'paid';
    booking.confirmedAt   = new Date();

    // Generate QR Code using shared utility
    const { qrBase64, qrPayload } = await generateBookingQR(
      booking,
      booking.user,
      booking.sport
    );
    booking.qrCode    = qrBase64;
    booking.qrPayload = qrPayload;

    const updatedBooking = await booking.save();

    // Send SMS notification
    if (updatedBooking.user && updatedBooking.user.phone) {
      const confirmSMS = `Booking ${updatedBooking.bookingReference} confirmed! Show QR at court entrance.`;
      sendSMS(updatedBooking.user.phone, confirmSMS).catch((err) => {
        console.error('[SMS Error] Failed to send payment confirmation SMS:', err);
      });
    }

    // Emit socket events
    if (req.app.get('io')) {
      req.app.get('io').emit('booking_confirmed', {
        bookingId:  updatedBooking._id.toString(),
        bookingRef: updatedBooking.bookingReference,
      });
      req.app.get('io').emit('slot_update', {
        sportId:   updatedBooking.sport._id.toString(),
        date:      updatedBooking.date,
        startTime: updatedBooking.startTime,
        endTime:   updatedBooking.endTime,
        status:    'confirmed',
      });
    }

    res.json(updatedBooking);
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Admin cancel a booking
// @route   PATCH /api/admin/bookings/:id/cancel
// @access  Private/Admin
export const adminCancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('sport', 'name').populate('user');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    booking.status = 'cancelled';
    if (booking.paymentStatus === 'paid') {
      booking.paymentStatus = 'refunded';
    }
    booking.cancelledAt = new Date();

    const updatedBooking = await booking.save();

    // Send SMS notification
    if (updatedBooking.user && updatedBooking.user.phone) {
      const cancelSMS = `Booking ${updatedBooking.bookingReference || updatedBooking._id.slice(-8).toUpperCase()} cancelled. Refund will be processed in 3-5 days.`;
      sendSMS(updatedBooking.user.phone, cancelSMS).catch((err) => {
        console.error('[SMS Error] Failed to send admin cancellation SMS:', err);
      });
    }

    // Emit slot_update event to mark slot as available
    if (req.app.get('io')) {
      req.app.get('io').emit('slot_update', {
        sportId: updatedBooking.sport._id.toString(),
        date: updatedBooking.date,
        startTime: updatedBooking.startTime,
        endTime: updatedBooking.endTime,
        status: 'available',
      });
    }

    res.json(updatedBooking);
  } catch (error) {
    console.error('Error cancelling booking by admin:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Verify booking by reference
// @route   GET /api/admin/bookings/verify/:bookingRef
// @access  Private/Admin
export const verifyBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingReference: req.params.bookingRef })
      .populate('user', 'name phone')
      .populate('sport', 'name');

    if (!booking) {
      return res.status(404).json({ valid: false, reason: 'invalid_qr', message: 'Booking reference not found' });
    }

    if (booking.status === 'cancelled') {
      return res.json({ valid: false, reason: 'cancelled', message: 'Booking Cancelled', booking });
    }

    if (booking.status === 'pending_payment') {
      return res.json({ valid: false, reason: 'payment_pending', message: 'Payment Pending — not yet confirmed', booking });
    }

    // Must be confirmed or completed
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (booking.date !== todayStr) {
      return res.json({ 
        valid: false, 
        reason: 'wrong_date_time', 
        message: `Wrong date/time (Booking is for ${booking.date})`, 
        booking 
      });
    }

    const currentHour = today.getHours();
    // Allow check-in up to 1 hour before start time, and up to end time
    if (currentHour < booking.startTime - 1 || currentHour >= booking.endTime) {
      const formatTime = (h) => {
        const actual = h >= 24 ? h - 24 : h;
        const suffix = actual < 12 ? 'AM' : 'PM';
        const display = actual === 0 ? 12 : (actual > 12 ? actual - 12 : actual);
        return `${display}:00 ${suffix}`;
      };

      return res.json({ 
        valid: false, 
        reason: 'wrong_date_time', 
        message: `Wrong date/time (Booking is scheduled for ${formatTime(booking.startTime)} - ${formatTime(booking.endTime)})`, 
        booking 
      });
    }

    return res.json({ valid: true, booking });
  } catch (error) {
    console.error('Error verifying booking:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Block a time slot
// @route   POST /api/admin/bookings/block
// @access  Private/Admin
export const blockTimeSlot = async (req, res) => {
  try {
    const { sportId, date, startTime, endTime } = req.body;

    if (!sportId || !date || startTime === undefined || endTime === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    if (startTime < 9 || endTime > 25) {
      return res.status(400).json({ message: 'Bookings only allowed between 9 AM and 1 AM' });
    }

    // Check for overlapping bookings (confirmed, pending_payment, or blocked)
    const existing = await Booking.find({
      sport: sportId,
      date,
      status: { $in: ['confirmed', 'pending_payment', 'blocked'] },
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    });

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Time slot overlaps with an existing booking or block' });
    }

    const durationHours = endTime - startTime;

    const booking = new Booking({
      sport: sportId,
      date,
      startTime,
      endTime,
      durationHours,
      totalPrice: 0,
      status: 'blocked',
      paymentStatus: 'paid'
    });

    const createdBooking = await booking.save();

    // Emit live slot_update for clients
    if (req.app.get('io')) {
      req.app.get('io').emit('slot_update', {
        sportId: createdBooking.sport.toString(),
        date: createdBooking.date,
        startTime: createdBooking.startTime,
        endTime: createdBooking.endTime,
        status: 'blocked',
      });
    }

    res.status(201).json(createdBooking);
  } catch (error) {
    console.error('Error blocking time slot:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Mark booking as checked-in at court
// @route   PATCH /api/admin/bookings/:id/checkin
// @access  Private/Admin
export const checkinBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'Only confirmed bookings can be checked in' });
    }

    if (booking.checkedIn) {
      return res.status(400).json({ message: 'Booking is already checked in' });
    }

    booking.checkedIn   = true;
    booking.checkedInAt = new Date();
    await booking.save();

    res.json({ message: 'Checked in successfully', checkedIn: true, checkedInAt: booking.checkedInAt });
  } catch (error) {
    console.error('Error checking in booking:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
