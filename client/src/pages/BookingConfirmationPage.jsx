import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { LuCheck, LuLoaderCircle, LuCalendar, LuDollarSign, LuClock, LuDownload, LuArrowLeft } from 'react-icons/lu';
import AuthContext from '../context/AuthContext';
import { formatHourLabel } from '../components/TimeSlotGrid';

const getPaymentMethodLabel = (method) => {
  switch (method) {
    case 'jazzcash': return 'JazzCash';
    case 'easypaisa': return 'Easypaisa';
    case 'stripe_card': return 'Card (Stripe)';
    default: return method || '';
  }
};

const BookingConfirmationPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useContext(AuthContext);
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const paymentCancelled = searchParams.get('payment') === 'cancelled';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, booking?.status]);

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleDownloadQR = () => {
    if (!booking?.qrCode) return;
    const link = document.createElement('a');
    link.href = booking.qrCode;
    link.download = `booking-qr-${booking.bookingReference || booking._id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-base)', color: 'var(--accent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font)', fontSize: '14px' }}>
          <span className="spinner" />
          <span>Loading booking details...</span>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-base)', fontFamily: 'var(--font)' }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}>
          <h2 style={{ color: 'var(--danger)', fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
            Failed to load booking
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {error || 'The requested booking could not be found.'}
          </p>
          <button onClick={() => navigate('/my-bookings')} className="btn-secondary" style={{ width: '100%' }}>
            View My Bookings
          </button>
        </div>
      </div>
    );
  }

  const displayDate = new Date(booking.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const pageVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.25, ease: 'easeOut' } 
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      style={{ 
        minHeight: '100vh', 
        backgroundColor: 'var(--bg-base)', 
        paddingTop: '56px',
        paddingBottom: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div style={{ maxWidth: '480px', width: '100%', marginTop: '56px' }}>

        {/* Stripe payment cancelled banner */}
        {paymentCancelled && (
          <div style={{ marginBottom: '20px', padding: '14px 16px', borderRadius: '8px', background: 'var(--warning-muted)', border: '1px solid var(--warning)', fontSize: '13px', color: 'var(--warning)', lineHeight: 1.5 }}>
            <strong>Payment was cancelled.</strong> Your booking slot is still reserved. You can try paying again from this page or choose a different payment method.
          </div>
        )}
        {booking.status === 'pending_payment' && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
            
            {/* Status Pill */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <span className="badge badge-pending" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="spinner" style={{ width: '10px', height: '10px', borderWidth: '1.5px' }} />
                Payment Pending
              </span>
            </div>

            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                Awaiting Confirmation
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
                Once our team confirms your payment, your QR code will appear here. This page updates automatically.
              </p>
            </div>

            {timeLeft > 0 ? (
              <div style={{ 
                backgroundColor: 'var(--danger-muted)', 
                border: '1px dashed var(--danger)', 
                borderRadius: '8px', 
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--danger)' }}>
                  Time Remaining to Pay
                </span>
                <span style={{ fontSize: '24px', fontWeight: 600, color: 'var(--danger)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            ) : (
              <div style={{ color: 'var(--danger)', fontSize: '14px', fontWeight: 500 }}>
                Payment window has expired.
              </div>
            )}

            <div style={{ textAlign: 'left', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span className="label-style">Booking Summary</span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Sport</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{booking.sport?.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Date</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{displayDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Time</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{formatHourLabel(booking.startTime)} &ndash; {formatHourLabel(booking.endTime)}</span>
                </div>
                <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Total</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Rs. {booking.totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {booking.paymentMethod && (
              <div style={{ textAlign: 'left', border: '1px dashed var(--border)', borderRadius: '8px', padding: '16px' }}>
                <span className="label-style" style={{ display: 'block', marginBottom: '8px' }}>
                  Instructions ({getPaymentMethodLabel(booking.paymentMethod)})
                </span>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                  Please transfer <strong>Rs. {booking.totalPrice.toLocaleString()}</strong> via {getPaymentMethodLabel(booking.paymentMethod)}. 
                  Ensure you input the reference details as instructed.
                </p>
              </div>
            )}

            <button onClick={() => navigate('/my-bookings')} className="btn-secondary" style={{ width: '100%' }}>
              Go to My Bookings
            </button>
          </div>
        )}

        {/* State 2: Confirmed */}
        {booking.status === 'confirmed' && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'center' }}>
            
            {/* Checkmark Circle */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--success-muted)', 
                border: '1px solid var(--success)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--success)'
              }}>
                <LuCheck size={24} />
              </div>
            </div>

            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                Booking Confirmed
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                Reference: <span className="mono-chip" style={{ fontSize: '12px' }}>{booking.bookingReference || booking._id.slice(-8).toUpperCase()}</span>
              </p>
            </div>

            {/* QR Card Container */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                backgroundColor: '#FFFFFF', 
                padding: '12px', 
                borderRadius: '12px', 
                display: 'inline-flex',
                boxShadow: 'var(--shadow)'
              }}>
                {booking.qrCode ? (
                  <img src={booking.qrCode} alt="Booking QR Code" style={{ width: '216px', height: '216px', display: 'block' }} />
                ) : (
                  <div style={{ width: '216px', height: '216px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)', fontSize: '13px' }}>
                    QR Code Not Available
                  </div>
                )}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 500 }}>
                Show this QR code at the court entrance
              </span>
            </div>

            {/* Flat Grid Details (2x2) */}
            <div style={{ 
              backgroundColor: 'var(--bg-elevated)', 
              border: '1px solid var(--border)', 
              borderRadius: '8px', 
              padding: '16px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              textAlign: 'left'
            }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', display: 'block', marginBottom: '2px' }}>Sport</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{booking.sport?.name}</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', display: 'block', marginBottom: '2px' }}>Date</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{displayDate}</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', display: 'block', marginBottom: '2px' }}>Time</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{formatHourLabel(booking.startTime)} &ndash; {formatHourLabel(booking.endTime)}</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', display: 'block', marginBottom: '2px' }}>Paid Amount</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--success)' }}>Rs. {booking.totalPrice.toLocaleString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                onClick={handleDownloadQR}
                className="btn-primary" 
                style={{ width: '100%', gap: '8px' }}
              >
                <LuDownload size={16} />
                Download QR Code
              </button>
              <Link to="/my-bookings" style={{ textDecoration: 'none' }}>
                <button className="btn-secondary" style={{ width: '100%' }}>
                  View My Bookings
                </button>
              </Link>
            </div>

          </div>
        )}

        {/* State 3: Cancelled / Completed */}
        {(booking.status === 'cancelled' || booking.status === 'completed') && (
           <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
             <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
               Booking {booking.status === 'cancelled' ? 'Cancelled' : 'Completed'}
             </h2>
             <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
               This booking reference has been marked as {booking.status}.
             </p>
             <Link to="/my-bookings" style={{ textDecoration: 'none' }}>
                <button className="btn-secondary" style={{ width: '100%' }}>
                  Go to My Bookings
                </button>
             </Link>
           </div>
        )}

      </div>
    </motion.div>
  );
};

export default BookingConfirmationPage;
