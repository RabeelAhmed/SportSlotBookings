import Stripe from 'stripe';
import Booking from '../models/Booking.js';
import { generateBookingQR } from '../utils/generateQR.js';
import { sendSMS } from '../utils/sms.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Helper: format hour number → "6:00 PM" etc.
const formatTime = (hour) => {
  const h = hour >= 24 ? hour - 24 : hour;
  if (h === 0) return '12:00 AM';
  if (h < 12) return `${h}:00 AM`;
  if (h === 12) return '12:00 PM';
  return `${h - 12}:00 PM`;
};

// ─── createCheckoutSession ────────────────────────────────────────────────────
// POST /api/payments/create-checkout-session
// Protected (JWT required)
export const createCheckoutSession = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ message: 'bookingId is required' });
    }

    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email phone')
      .populate('sport', 'name');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Ownership check
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Status check
    if (booking.status !== 'pending_payment') {
      return res.status(400).json({ message: 'Booking is not pending payment' });
    }

    // Expiry check
    if (booking.expiresAt && new Date() > booking.expiresAt) {
      return res.status(400).json({ message: 'Booking has expired' });
    }

    const description =
      `${booking.date} · ${formatTime(booking.startTime)} – ${formatTime(booking.endTime)} · ${booking.durationHours} hr${booking.durationHours !== 1 ? 's' : ''}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: req.user.email,
      metadata: {
        bookingId:  booking._id.toString(),
        bookingRef: booking.bookingReference,
        userId:     req.user._id.toString(),
      },
      line_items: [
        {
          price_data: {
            currency: 'pkr',
            product_data: {
              name:        `${booking.sport.name} Court Booking`,
              description: description,
            },
            unit_amount: booking.totalPrice * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/booking/${'{CHECKOUT_SESSION_ID}'}/success`,
      cancel_url:  `${process.env.CLIENT_URL}/booking/${booking._id}?payment=cancelled`,
    });

    res.json({ sessionId: session.id, sessionUrl: session.url });
  } catch (error) {
    console.error('[Stripe] createCheckoutSession error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ─── stripeWebhook ────────────────────────────────────────────────────────────
// POST /api/payments/webhook
// PUBLIC — uses express.raw() body parser
export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  // Handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { bookingId, bookingRef, userId } = session.metadata;

    try {
      const booking = await Booking.findById(bookingId)
        .populate('user', 'name phone email')
        .populate('sport', 'name');

      if (!booking) {
        console.error(`[Stripe Webhook] Booking not found: ${bookingId}`);
        return res.status(200).json({ received: true }); // still 200 to Stripe
      }

      // Update booking
      booking.status              = 'confirmed';
      booking.paymentStatus       = 'paid';
      booking.paymentMethod       = 'stripe_card';
      booking.stripeSessionId     = session.id;
      booking.stripePaymentIntent = session.payment_intent;
      booking.confirmedAt         = new Date();

      // Generate QR code
      const { qrBase64, qrPayload } = await generateBookingQR(
        booking,
        booking.user,
        booking.sport
      );
      booking.qrCode    = qrBase64;
      booking.qrPayload = qrPayload;

      await booking.save();

      // Emit socket events
      const io = req.app.get('io');
      if (io) {
        io.emit('booking_confirmed', { bookingId, bookingRef });
        io.emit('slot_update', {
          sportId:   booking.sport._id.toString(),
          date:      booking.date,
          startTime: booking.startTime,
          endTime:   booking.endTime,
          status:    'confirmed',
        });
      }

      // SMS notification
      if (booking.user?.phone) {
        const sms = `SportSlot: Booking ${bookingRef} confirmed via Card. Show QR at court entrance.`;
        sendSMS(booking.user.phone, sms).catch((err) => {
          console.error('[SMS Error] Stripe webhook SMS failed:', err);
        });
      }

      console.log(`[Stripe Webhook] Booking ${bookingRef} confirmed.`);
    } catch (err) {
      console.error('[Stripe Webhook] Processing error:', err);
    }
  }

  // Always respond 200 immediately to Stripe
  res.status(200).json({ received: true });
};

// ─── getPaymentStatus ─────────────────────────────────────────────────────────
// GET /api/payments/status/:sessionId
// Protected (JWT required)
export const getPaymentStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const booking = await Booking.findOne({ stripeSessionId: sessionId })
      .populate('sport', 'name')
      .populate('user', 'name');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found for this session' });
    }

    res.json({
      status:     booking.status,
      bookingId:  booking._id,
      bookingRef: booking.bookingReference,
      qrCode:     booking.qrCode,
      sport:      booking.sport?.name,
      date:       booking.date,
      startTime:  booking.startTime,
      endTime:    booking.endTime,
      duration:   booking.durationHours,
      totalPrice: booking.totalPrice,
      paymentMethod: booking.paymentMethod,
    });
  } catch (error) {
    console.error('[getPaymentStatus] error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
