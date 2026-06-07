import express from 'express';
import { getSlotAvailability, createBooking, cancelBooking, getBookingById, getMyBookings, getCheckinByRef } from '../controllers/bookingController.js';
import { protect } from '../middleware/auth.js';
import { createBookingValidator } from '../middleware/validation.js';

const router = express.Router();

// Public route — no auth required (QR scan landing page)
router.route('/checkin/:bookingRef').get(getCheckinByRef);

router.route('/').post(protect, createBookingValidator, createBooking);
router.route('/availability').get(getSlotAvailability);
router.route('/my').get(protect, getMyBookings);
router.route('/my-bookings').get(protect, getMyBookings);
router.route('/:id').get(protect, getBookingById);
router.route('/:id/cancel').put(protect, cancelBooking).patch(protect, cancelBooking);

export default router;

