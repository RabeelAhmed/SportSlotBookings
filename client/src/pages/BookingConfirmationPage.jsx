import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import AuthContext from '../context/AuthContext';

/* ─── Helpers ───────────────────────────────────────────────── */
const formatHour = (h) => {
  const actual = h >= 24 ? h - 24 : h;
  const suffix = actual < 12 ? 'AM' : 'PM';
  const display = actual === 0 ? 12 : actual > 12 ? actual - 12 : actual;
  return display + ':00 ' + suffix;
};

const getPaymentMethodLabel = (method) => {
  switch (method) {
    case 'jazzcash': return 'JazzCash';
    case 'easypaisa': return 'Easypaisa';
    case 'bank_transfer': return 'Bank Transfer';
    default: return method;
  }
};

const BookingConfirmationPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useContext(AuthContext);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  // Fetch booking
  const fetchBooking = async () => {
    try {
      const { data } = await axios.get(`/api/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBooking(data);
      
      if (data.status === 'pending_payment' && data.expiresAt) {
        const expiresMs = new Date(data.expiresAt).getTime();
        const nowMs = new Date().getTime();
        const remaining = Math.max(0, Math.floor((expiresMs - nowMs) / 1000));
        setTimeLeft(remaining);
      } else {
        setTimeLeft(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch booking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchBooking();
  }, [bookingId, isAuthenticated]);

  // Polling every 15 seconds if pending
  useEffect(() => {
    let pollInterval;
    if (booking?.status === 'pending_payment') {
      pollInterval = setInterval(fetchBooking, 15000);
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [booking?.status]);

  // Countdown timer local tick
  useEffect(() => {
    let timerInterval;
    if (booking?.status === 'pending_payment' && timeLeft !== null && timeLeft > 0) {
      timerInterval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            fetchBooking(); // Fetch to get potentially updated status or cancelled status
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [timeLeft, booking?.status]);

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleDownloadQR = () => {
    if (!booking?.qrCode) return;
    const a = document.createElement('href');
    a.href = booking.qrCode;
    a.download = `booking-qr-${booking.bookingReference || booking._id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0F', color: '#00FF87' }}>
        <div style={{ fontSize: '1.25rem', fontFamily: "'Inter', sans-serif" }}>Loading...</div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0F', color: '#FF5050', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2>{error || 'Booking not found'}</h2>
          <button onClick={() => navigate('/my-bookings')} style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: '#13131A', border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0F5', borderRadius: '0.75rem', cursor: 'pointer' }}>View My Bookings</button>
        </div>
      </div>
    );
  }

  const displayDate = new Date(booking.date).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Inter', sans-serif", paddingTop: '100px', paddingBottom: '60px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* State 1: Payment Pending */}
        {booking.status === 'pending_payment' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ background: '#13131A', borderRadius: '1.5rem', border: '1px solid rgba(255,200,0,0.2)', padding: '2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              
              <motion.div 
                animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }} 
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,200,0,0.1)', color: '#FFC800', padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.5rem' }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFC800' }}></div>
                Payment Pending
              </motion.div>

              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F0F0F5', marginBottom: '0.5rem' }}>Waiting for Payment Confirmation</h1>
              <p style={{ color: '#9898B0', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto 2rem' }}>
                Once our team confirms your payment, your QR code will appear here. This page updates automatically.
              </p>

              {timeLeft > 0 ? (
                <div style={{ background: 'rgba(255, 60, 60, 0.05)', border: '1px dashed rgba(255, 60, 60, 0.3)', borderRadius: '1rem', padding: '1.25rem', marginBottom: '2rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#FF5050', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '0.5rem' }}>Time left to pay</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FF5050', fontVariantNumeric: 'tabular-nums' }}>{formatTime(timeLeft)}</div>
                </div>
              ) : (
                <div style={{ color: '#FF5050', marginBottom: '2rem', fontWeight: 600 }}>Payment window has expired.</div>
              )}

              <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', color: '#F0F0F5', marginBottom: '1rem', fontWeight: 700 }}>Booking Summary</h3>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9898B0', fontSize: '0.9rem' }}>Sport</span>
                    <span style={{ color: '#F0F0F5', fontSize: '0.9rem', fontWeight: 600 }}>{booking.sport?.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9898B0', fontSize: '0.9rem' }}>Date</span>
                    <span style={{ color: '#F0F0F5', fontSize: '0.9rem', fontWeight: 600 }}>{displayDate}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9898B0', fontSize: '0.9rem' }}>Time</span>
                    <span style={{ color: '#F0F0F5', fontSize: '0.9rem', fontWeight: 600 }}>{formatHour(booking.startTime)} → {formatHour(booking.endTime)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9898B0', fontSize: '0.9rem' }}>Amount</span>
                    <span style={{ color: '#00FF87', fontSize: '1rem', fontWeight: 800 }}>Rs. {booking.totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {booking.paymentMethod && (
                <div style={{ textAlign: 'left', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '1rem', padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.95rem', color: '#F0F0F5', marginBottom: '0.5rem', fontWeight: 700 }}>Instructions ({getPaymentMethodLabel(booking.paymentMethod)})</h3>
                  <p style={{ color: '#9898B0', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                    Please transfer <strong>Rs. {booking.totalPrice.toLocaleString()}</strong> via {getPaymentMethodLabel(booking.paymentMethod)}. 
                    Use booking reference <strong>[REF]</strong> as the description.
                  </p>
                </div>
              )}

            </div>
          </motion.div>
        )}

        {/* State 2: Confirmed */}
        {booking.status === 'confirmed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
          >
            <div style={{ background: '#13131A', borderRadius: '1.5rem', border: '1px solid rgba(0,255,135,0.2)', padding: '2.5rem 2rem', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,255,135,0.05)' }}>
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                style={{ width: '80px', height: '80px', background: 'rgba(0,255,135,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00FF87" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <motion.polyline 
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    points="20 6 9 17 4 12"
                  ></motion.polyline>
                </svg>
              </motion.div>

              <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#F0F0F5', marginBottom: '0.5rem' }}>Booking Confirmed!</h1>
              <div style={{ color: '#9898B0', fontSize: '0.95rem', marginBottom: '2rem' }}>
                Ref: <span style={{ color: '#F0F0F5', fontWeight: 700, letterSpacing: '0.05em' }}>{booking.bookingReference || booking._id.slice(-8).toUpperCase()}</span>
              </div>

              {/* QR Code Section */}
              <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '1.25rem', display: 'inline-block', marginBottom: '1.5rem' }}>
                {booking.qrCode ? (
                  <img src={booking.qrCode} alt="Booking QR Code" style={{ width: '200px', height: '200px', display: 'block' }} />
                ) : (
                  <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0', color: '#666' }}>QR not available</div>
                )}
              </div>
              <p style={{ color: '#00FF87', fontSize: '0.9rem', fontWeight: 600, marginBottom: '2.5rem' }}>
                Show this QR code at the court entrance
              </p>

              {/* Booking details card */}
              <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#9898B0', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Sport</div>
                    <div style={{ color: '#F0F0F5', fontWeight: 600 }}>{booking.sport?.name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#9898B0', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Date</div>
                    <div style={{ color: '#F0F0F5', fontWeight: 600 }}>{displayDate}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#9898B0', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Time</div>
                    <div style={{ color: '#F0F0F5', fontWeight: 600 }}>{formatHour(booking.startTime)} - {formatHour(booking.endTime)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#9898B0', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Amount Paid</div>
                    <div style={{ color: '#00FF87', fontWeight: 700 }}>Rs. {booking.totalPrice.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownloadQR}
                  style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg,#00FF87,#00cc6a)', border: 'none', borderRadius: '0.75rem', color: '#0A0A0F', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
                >
                  ↓ Download QR Code
                </motion.button>
                <Link to="/my-bookings" style={{ textDecoration: 'none' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#F0F0F5', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
                  >
                    View My Bookings
                  </motion.button>
                </Link>
              </div>

            </div>
          </motion.div>
        )}

        {/* State 3: Cancelled / Expired */}
        {(booking.status === 'cancelled' || booking.status === 'completed') && (
           <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#13131A', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
             <h2 style={{ color: '#F0F0F5', marginBottom: '1rem' }}>Booking is {booking.status}</h2>
             <Link to="/my-bookings">
                <button style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0F5', borderRadius: '0.5rem', cursor: 'pointer' }}>
                  Go to My Bookings
                </button>
             </Link>
           </div>
        )}

      </div>
    </div>
  );
};

export default BookingConfirmationPage;
