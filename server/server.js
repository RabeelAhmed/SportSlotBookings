import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes.js';
import sportRoutes from './routes/sportRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { stripeWebhook } from './controllers/paymentController.js';
import { checkBookingExpirations } from './utils/bookingExpiry.js';
import User from './models/User.js';

// Load environment variables (done via import 'dotenv/config')

const app = express();

// Trust proxy for rate limiting (if behind reverse proxy/load balancer)
app.set('trust proxy', 1);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Adjust this to your client URL in production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Make io accessible in controllers
app.set('io', io);

// Global rate limiter: 100 requests per 15 minutes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(globalLimiter);
app.use(cors());

// CRITICAL: Stripe webhook MUST be mounted BEFORE express.json().
// The raw body is required for stripe.webhooks.constructEvent signature verification.
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

// Global JSON body parser (must come AFTER raw webhook route)
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sports', sportRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'SportSlot API is running',
    timestamp: new Date()
  });
});

// Temporary debug route to check users
app.get('/api/debug-users', async (req, res) => {
  try {
    const users = await User.find({}, 'name email phone role');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Port and DB Uri
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sportslot';

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    
    // Start chron job to check booking expirations every 60 seconds
    setInterval(() => checkBookingExpirations(io), 60000);
    console.log('Booking expiration checker started.');

    // Ensure the specified user is promoted to admin if they are already registered
    // Match phone regardless of formatting: 03436324197 or 0343-6324197 or 0343 6324197
    User.findOneAndUpdate(
      { phone: { $regex: /^0343.?6324197$/ } },
      { role: 'admin' },
      { returnDocument: 'after' }
    ).then((updatedUser) => {
      if (updatedUser) {
        console.log(`[Database] Admin role set for: ${updatedUser.phone} (${updatedUser.name})`);
      } else {
        console.log(`[Database] Admin user (0343-6324197) not registered yet — role will be set at registration.`);
      }
    }).catch((err) => {
      console.error('[Database] Error checking/updating admin role:', err.message);
    });

    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err.message);
    console.log('Starting server in fallback mode without database connection...');
    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} (No DB Connection)`);
    });
  });
