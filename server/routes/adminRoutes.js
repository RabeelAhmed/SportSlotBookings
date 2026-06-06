import express from 'express';
import { getAdminStats, getAllBookings, confirmPayment, adminCancelBooking, verifyBooking, blockTimeSlot } from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, adminOnly);

router.route('/stats').get(getAdminStats);
router.route('/bookings').get(getAllBookings);
router.route('/bookings/verify/:bookingRef').get(verifyBooking);
router.route('/bookings/block').post(blockTimeSlot);
router.route('/bookings/:id/confirm-payment').patch(confirmPayment);
router.route('/bookings/:id/cancel').patch(adminCancelBooking);

export default router;
