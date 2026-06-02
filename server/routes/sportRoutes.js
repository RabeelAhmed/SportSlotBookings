import express from 'express';
import { getAllSports, getSportById, createSport, toggleSport } from '../controllers/sportController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(getAllSports).post(protect, adminOnly, createSport);
router.route('/:id').get(getSportById);
router.route('/:id/toggle').put(protect, adminOnly, toggleSport);

export default router;
