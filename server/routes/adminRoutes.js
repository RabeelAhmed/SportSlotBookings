import express from 'express';
import { getAdminStats, getAllBookings, confirmPayment, adminCancelBooking, verifyBooking, blockTimeSlot, checkinBooking } from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { blockSlotValidator } from '../middleware/validation.js';

const router = express.Router();

router.use(protect, adminOnly);

router.route('/stats').get(getAdminStats);
router.route('/bookings').get(getAllBookings);
router.route('/bookings/verify/:bookingRef').get(verifyBooking);
router.route('/bookings/block').post(blockSlotValidator, blockTimeSlot);
router.route('/bookings/:id/confirm-payment').patch(confirmPayment);
router.route('/bookings/:id/cancel').patch(adminCancelBooking);
router.route('/bookings/:id/checkin').patch(checkinBooking);

export default router;

