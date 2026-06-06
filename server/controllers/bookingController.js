import Booking from '../models/Booking.js';
import { calculatePrice, generateBookingReference } from '../utils/helpers.js';

// @desc    Get slot availability
// @route   GET /api/bookings/availability?sportId=xxx&date=YYYY-MM-DD
// @access  Public
export const getSlotAvailability = async (req, res) => {
  try {
    const { sportId, date } = req.query;
    
    if (!sportId || !date) {
      return res.status(400).json({ message: 'sportId and date are required' });
    }

    // Find all confirmed, pending or blocked bookings for this sport and date
    const bookings = await Booking.find({
      sport: sportId,
      date,
      status: { $in: ['confirmed', 'pending_payment', 'blocked'] }
    });

    const slots = [];
    
    for (let hour = 0; hour < 24; hour++) {
      let status = 'available';
      let pricePerHour = 0;
      let bookingId = null;

      if (hour >= 9 && hour < 17) {
        pricePerHour = 1000;
      } else if (hour >= 17 && hour < 25) { // up to 1AM next day
        pricePerHour = 1500;
      } else {
        status = 'closed';
      }

      // Check if this hour is booked or blocked
      const overlappingBooking = bookings.find(b => hour >= b.startTime && hour < b.endTime);
      
      if (overlappingBooking && status !== 'closed') {
        if (overlappingBooking.status === 'blocked') {
          status = 'blocked';
        } else if (overlappingBooking.status === 'pending_payment') {
          status = 'pending';
        } else {
          status = 'booked';
        }
        bookingId = overlappingBooking._id;
      }

      const label = hour === 0 ? '12:00 AM' : (hour < 12 ? `${hour}:00 AM` : (hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`));

      slots.push({
        hour,
        label,
        status,
        bookingId,
        pricePerHour
      });
    }

    res.json(slots);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get user's bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('sport', 'name')
      .sort({ date: -1, startTime: -1 });
    
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('sport', 'name')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns the booking or is admin
    if (req.user.role !== 'admin' && (!booking.user || booking.user._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
export const createBooking = async (req, res) => {
  try {
    const { sportId, date, startTime, endTime, paymentMethod } = req.body;

    if (!sportId || !date || startTime === undefined || endTime === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    if (startTime < 9 || endTime > 25) {
      return res.status(400).json({ message: 'Bookings only allowed between 9 AM and 1 AM' });
    }

    const durationHours = endTime - startTime;
    if (durationHours > 4) {
      return res.status(400).json({ message: 'Maximum booking duration is 4 hours' });
    }

    // Check overlaps
    const existingBookings = await Booking.find({
      sport: sportId,
      date,
      status: { $in: ['confirmed', 'pending_payment'] },
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    });

    if (existingBookings.length > 0) {
      return res.status(400).json({ message: 'Slot is already booked' });
    }

    // Calculate price
    const totalPrice = calculatePrice(startTime, endTime);

    const booking = new Booking({
      user: req.user._id,
      sport: sportId,
      date,
      startTime,
      endTime,
      durationHours,
      totalPrice,
      status: 'pending_payment',
      paymentMethod
    });

    // Assign unique booking reference
    booking.bookingReference = generateBookingReference();

    // 10 minute payment timeout
    booking.expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const createdBooking = await booking.save();

    // Emit live slot_update for clients
    req.app.get('io').emit('slot_update', {
      sportId: createdBooking.sport.toString(),
      date: createdBooking.date,
      startTime: createdBooking.startTime,
      endTime: createdBooking.endTime,
      status: 'pending',
    });

    res.status(201).json(createdBooking);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns the booking or is admin
    if (req.user.role !== 'admin' && (!booking.user || booking.user.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    // Parse booking date and time
    const bookingDate = new Date(booking.date);
    bookingDate.setHours(booking.startTime, 0, 0, 0);

    const now = new Date();
    const hoursDifference = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDifference < 4) {
      return res.status(400).json({ message: 'Can only cancel bookings 4 or more hours in advance' });
    }

    booking.status = 'cancelled';
    if (booking.paymentStatus === 'paid') {
      booking.paymentStatus = 'refunded';
    }
    booking.cancelledAt = new Date();

    const updatedBooking = await booking.save();

    // Emit slot_update event to mark slot as available
    req.app.get('io').emit('slot_update', {
      sportId: updatedBooking.sport.toString(),
      date: updatedBooking.date,
      startTime: updatedBooking.startTime,
      endTime: updatedBooking.endTime,
      status: 'available',
    });

    res.json(updatedBooking);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
