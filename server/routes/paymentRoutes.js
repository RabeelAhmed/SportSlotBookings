// Local dev: run `stripe listen --forward-to localhost:5000/api/payments/webhook`
// to receive Stripe webhook events. Update STRIPE_WEBHOOK_SECRET in .env.
import express from 'express';
import { createCheckoutSession, stripeWebhook, getPaymentStatus } from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// IMPORTANT: Webhook must use raw body parser — mounted BEFORE express.json() in server.js
// The raw body is required for Stripe signature verification.
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

// Protected routes
router.post('/create-checkout-session', protect, createCheckoutSession);
router.get('/status/:sessionId', protect, getPaymentStatus);

export default router;
