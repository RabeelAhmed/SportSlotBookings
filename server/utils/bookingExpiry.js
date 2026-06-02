import Booking from '../models/Booking.js';

export const checkBookingExpirations = async (io) => {
  try {
    const now = new Date();
    
    // Find pending bookings where the expiration time has passed
    const expiredBookings = await Booking.find({
      status: 'pending_payment',
      expiresAt: { $lt: now }
    });

    if (expiredBookings.length > 0) {
      for (const booking of expiredBookings) {
        booking.status = 'cancelled';
        booking.cancelledAt = now;
        await booking.save();
        
        // Emit slot_update event to mark slots available
        io.emit('slot_update', {
          sportId: booking.sport.toString(),
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: 'available',
        });
      }
      console.log(`Cancelled ${expiredBookings.length} expired bookings.`);
    }
  } catch (error) {
    console.error('Error checking booking expirations:', error);
  }
};
