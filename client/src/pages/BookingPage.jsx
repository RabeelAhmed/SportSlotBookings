import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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

const getSportCfg = (name = '') => {
  const lc = name.toLowerCase();
  if (lc.includes('cricket')) return { emoji: '🏏', gradient: 'linear-gradient(135deg,#00FF87,#00cc6a)', glow: 'rgba(0,255,135,0.2)', accent: '#00FF87' };
  if (lc.includes('football')) return { emoji: '⚽', gradient: 'linear-gradient(135deg,#00ccff,#0077ff)', glow: 'rgba(0,200,255,0.2)', accent: '#00ccff' };
  return { emoji: '🏟️', gradient: 'linear-gradient(135deg,#a855f7,#6366f1)', glow: 'rgba(168,85,247,0.2)', accent: '#a855f7' };
};

const BookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useContext(AuthContext);

  // Retrieve state passed from SportPage.jsx
  // SportPage passes: { sportId, sportName, date, startHour, endHour, price }
  const state = location.state || {};
  const { sportId, sportName, date, startHour, endHour, price } = state;

  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to book.');
      navigate('/login');
      return;
    }
    if (!sportId || startHour === undefined || endHour === undefined) {
      toast.error('Invalid booking details. Please select a slot again.');
      navigate('/');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error('Booking session expired.');
          navigate(`/sport/${sportId}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sportId, startHour, endHour, isAuthenticated, navigate]);

  if (!sportId || startHour === undefined || endHour === undefined) {
    return null; // Will redirect in useEffect
  }

  const duration = endHour - startHour;
  let offPeakHours = 0;
  let peakHours = 0;

  for (let h = startHour; h < endHour; h++) {
    if (h >= 9 && h < 17) offPeakHours++;
    else if (h >= 17 && h < 25) peakHours++;
  }

  const cfg = getSportCfg(sportName);

  // Format date correctly
  const displayDate = new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleConfirm = async () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        '/api/bookings',
        {
          sportId,
          date,
          startTime: startHour,
          endTime: endHour,
          paymentMethod, // Assuming backend accepts paymentMethod in createBooking later, or we just pass it
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Booking created successfully!');
      navigate(`/booking/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Inter', sans-serif", paddingTop: '100px', paddingBottom: '40px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <button onClick={() => navigate(-1)} style={{
            background: 'none', border: 'none', color: '#9898B0', fontSize: '0.85rem', cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            ← Back
          </button>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#F0F0F5', margin: 0 }}>Complete Your Booking</h1>
          <p style={{ color: '#9898B0', marginTop: '0.5rem' }}>Review your details and select a payment method.</p>
        </div>

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          
          {/* Booking Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: '#13131A',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '1.25rem',
              padding: '1.5rem',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '2.5rem' }}>{cfg.emoji}</span>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F0F0F5', margin: 0 }}>{sportName}</h2>
                  <div style={{ color: '#9898B0', fontSize: '0.85rem', marginTop: '0.2rem' }}>{displayDate}</div>
                </div>
              </div>
              <div style={{
                background: 'rgba(255, 60, 60, 0.1)',
                border: '1px solid rgba(255, 60, 60, 0.2)',
                color: '#FF5050',
                padding: '0.4rem 0.75rem',
                borderRadius: '0.5rem',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>⏱</span> {formatTime(timeLeft)}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#9898B0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Time</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#F0F0F5' }}>{formatHour(startHour)} → {formatHour(endHour)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#9898B0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Duration</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#F0F0F5' }}>{duration} hour{duration > 1 ? 's' : ''}</div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F0F0F5', marginBottom: '1rem' }}>Price Breakdown</h3>
              
              {offPeakHours > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                  <span style={{ color: '#9898B0' }}>Off-Peak (9AM - 5PM)</span>
                  <span style={{ color: '#F0F0F5' }}>{offPeakHours} hr{offPeakHours > 1 ? 's' : ''} × Rs. 1,000 = Rs. {(offPeakHours * 1000).toLocaleString()}</span>
                </div>
              )}
              {peakHours > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                  <span style={{ color: '#9898B0' }}>Peak (5PM - 1AM)</span>
                  <span style={{ color: '#F0F0F5' }}>{peakHours} hr{peakHours > 1 ? 's' : ''} × Rs. 1,500 = Rs. {(peakHours * 1500).toLocaleString()}</span>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '1.25rem', fontWeight: 800 }}>
                <span style={{ color: '#F0F0F5' }}>Total</span>
                <span style={{ color: '#00FF87' }}>Rs. {(price || 0).toLocaleString()}</span>
              </div>
            </div>
          </motion.div>

          {/* Payment Method Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F0F0F5', marginBottom: '1rem' }}>Select Payment Method</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              
              {[
                { id: 'jazzcash', name: 'JazzCash', icon: '📱' },
                { id: 'easypaisa', name: 'Easypaisa', icon: '💸' },
                { id: 'bank_transfer', name: 'Bank Transfer', icon: '🏦' },
              ].map(method => (
                <motion.div
                  key={method.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPaymentMethod(method.id)}
                  style={{
                    background: paymentMethod === method.id ? 'rgba(0,255,135,0.05)' : '#13131A',
                    border: paymentMethod === method.id ? '2px solid #00FF87' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '1rem',
                    padding: '1.25rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>{method.icon}</span>
                  <span style={{ fontSize: '1rem', fontWeight: 600, color: paymentMethod === method.id ? '#00FF87' : '#F0F0F5' }}>{method.name}</span>
                </motion.div>
              ))}

            </div>
          </motion.div>

          {/* Payment Instructions Panel */}
          {paymentMethod && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px dashed rgba(255,255,255,0.2)',
                borderRadius: '1rem',
                padding: '1.5rem',
                marginTop: '0.5rem'
              }}>
                <h4 style={{ fontSize: '1rem', color: '#F0F0F5', marginBottom: '1rem', fontWeight: 700 }}>Payment Instructions</h4>
                
                {paymentMethod === 'jazzcash' && (
                  <p style={{ color: '#9898B0', fontSize: '0.95rem', lineHeight: 1.6 }}>
                    Send <strong style={{ color: '#F0F0F5' }}>Rs. {(price || 0).toLocaleString()}</strong> to <strong style={{ color: '#F0F0F5' }}>0300-1234567</strong> (Account: SportSlot Court). Use booking ref <strong style={{ color: '#00FF87' }}>[REF]</strong> as description.
                  </p>
                )}
                {paymentMethod === 'easypaisa' && (
                  <p style={{ color: '#9898B0', fontSize: '0.95rem', lineHeight: 1.6 }}>
                    Send <strong style={{ color: '#F0F0F5' }}>Rs. {(price || 0).toLocaleString()}</strong> to <strong style={{ color: '#F0F0F5' }}>0345-1234567</strong> (Account: SportSlot Court). Use booking ref <strong style={{ color: '#00FF87' }}>[REF]</strong> as description.
                  </p>
                )}
                {paymentMethod === 'bank_transfer' && (
                  <div style={{ color: '#9898B0', fontSize: '0.95rem', lineHeight: 1.6 }}>
                    <p style={{ marginBottom: '0.5rem' }}>Transfer <strong style={{ color: '#F0F0F5' }}>Rs. {(price || 0).toLocaleString()}</strong> to the following account:</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      <li>Bank: <strong style={{ color: '#F0F0F5' }}>Meezan Bank</strong></li>
                      <li>Account Name: <strong style={{ color: '#F0F0F5' }}>SportSlot Pvt Ltd</strong></li>
                      <li>Account Number: <strong style={{ color: '#F0F0F5' }}>0123 4567 8910</strong></li>
                      <li>Branch Code: <strong style={{ color: '#F0F0F5' }}>0123</strong></li>
                    </ul>
                    <p style={{ marginTop: '0.5rem' }}>Use booking ref <strong style={{ color: '#00FF87' }}>[REF]</strong> as reference.</p>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirm}
                  disabled={loading}
                  style={{
                    width: '100%',
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: cfg.gradient,
                    border: 'none',
                    borderRadius: '0.75rem',
                    color: '#0A0A0F',
                    fontWeight: 800,
                    fontSize: '1rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    boxShadow: `0 4px 20px ${cfg.glow}`,
                    fontFamily: "'Inter', sans-serif"
                  }}
                >
                  {loading ? 'Confirming...' : 'I have made the payment'}
                </motion.button>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};

export default BookingPage;
