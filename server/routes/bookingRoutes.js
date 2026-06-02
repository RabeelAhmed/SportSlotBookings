import express from 'express';
import { getSlotAvailability, createBooking, cancelBooking } from '../controllers/bookingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/').post(protect, createBooking);
router.route('/availability').get(getSlotAvailability);
router.route('/:id/cancel').put(protect, cancelBooking);

export default router;
