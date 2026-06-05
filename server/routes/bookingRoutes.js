import express from 'express';
import { getSlotAvailability, createBooking, cancelBooking, getBookingById, getMyBookings } from '../controllers/bookingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/').post(protect, createBooking);
router.route('/availability').get(getSlotAvailability);
router.route('/my-bookings').get(protect, getMyBookings);
router.route('/:id').get(protect, getBookingById);
router.route('/:id/cancel').put(protect, cancelBooking);

export default router;
