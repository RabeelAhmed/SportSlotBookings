import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import AuthContext from '../context/AuthContext';
import { formatHourLabel } from '../components/TimeSlotGrid';

const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const formatPaymentMethod = (method) => {
  if (method === 'stripe_card') return 'Card (Stripe)';
  if (method === 'easypaisa') return 'Easypaisa';
  if (method === 'jazzcash') return 'JazzCash';
  return method || '—';
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

const PaymentSuccessPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [booking, setBooking] = useState(null);
  const [polling, setPolling] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const pollCount = useRef(0);
  const MAX_POLLS = 10; // 30 seconds at 3s intervals

  useEffect(() => {
    if (!sessionId) { setError('Invalid session.'); setPolling(false); return; }

    const poll = async () => {
      try {
        const { data } = await axios.get(`/api/payments/status/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.status === 'confirmed') {
          setBooking(data);
          setPolling(false);
        } else {
          pollCount.current += 1;
          if (pollCount.current >= MAX_POLLS) {
            setError('Booking confirmation is taking longer than expected. Please check My Bookings or contact support.');
            setPolling(false);
          }
        }
      } catch (err) {
        if (err.response?.status === 404) {
          pollCount.current += 1;
          if (pollCount.current >= MAX_POLLS) {
            setError('Could not find your booking. Please check My Bookings.');
            setPolling(false);
          }
        } else {
          setError('Failed to fetch booking status. Please check My Bookings.');
          setPolling(false);
        }
      }
    };

    poll();
    const interval = setInterval(() => {
      if (!polling) { clearInterval(interval); return; }
      poll();
    }, 3000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, token]);

  const handleCopyRef = () => {
    if (booking?.bookingRef) {
      navigator.clipboard.writeText(booking.bookingRef).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleDownloadQR = () => {
    if (!booking?.qrCode) return;
    const a = document.createElement('a');
    a.href = booking.qrCode;
    a.download = `sportslot-${booking.bookingRef}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid var(--border-subtle)',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', paddingTop: '80px', paddingBottom: '60px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '520px', padding: '0 24px' }}>

        {/* Loading / Polling State */}
        {polling && !booking && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', paddingTop: '60px' }}>
            <span className="spinner" style={{ width: '20px', height: '20px', borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Confirming your booking...</span>
          </div>
        )}

        {/* Error State */}
        {error && !booking && (
          <div style={{ textAlign: 'center', paddingTop: '40px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <p style={{ fontSize: '15px', color: 'var(--danger)', fontWeight: 500 }}>{error}</p>
            <button className="btn-primary" onClick={() => navigate('/my-bookings')}>View My Bookings</button>
          </div>
        )}

        {/* Confirmed State */}
        {booking && !polling && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>

            {/* Success Icon */}
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--success-muted)', border: '1px solid var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
              <CheckIcon />
            </div>

            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>Payment Successful</h1>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>Your booking has been confirmed.</p>
            </div>

            {/* Booking Ref */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 16px', width: '100%', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Booking Ref</span>
                <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.05em' }}>{booking.bookingRef}</span>
              </div>
              <button onClick={handleCopyRef} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: copied ? 'var(--success)' : 'var(--text-muted)', transition: 'color 0.2s', padding: '4px 8px' }}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* QR Code */}
            {booking.qrCode && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', width: '100%' }}>
                <img src={booking.qrCode} alt="Booking QR Code" style={{ width: '240px', height: '240px', borderRadius: '8px' }} />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Show this at court entrance</p>
              </div>
            )}

            {/* Booking Details */}
            <div style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px 0' }}>Booking Details</h3>
              <div>
                {[
                  ['Sport', booking.sport || '—'],
                  ['Date', formatDisplayDate(booking.date)],
                  ['Time', booking.startTime !== undefined ? `${formatHourLabel(booking.startTime)} – ${formatHourLabel(booking.endTime)}` : '—'],
                  ['Duration', booking.duration ? `${booking.duration} hour${booking.duration !== 1 ? 's' : ''}` : '—'],
                  ['Amount Paid', booking.totalPrice ? `Rs. ${booking.totalPrice.toLocaleString()}` : '—'],
                  ['Payment', formatPaymentMethod(booking.paymentMethod)],
                ].map(([label, value]) => (
                  <div key={label} style={rowStyle}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button onClick={handleDownloadQR} className="btn-secondary" style={{ flex: 1, height: '44px' }}>Download QR</button>
              <button onClick={() => navigate('/my-bookings')} className="btn-primary" style={{ flex: 1, height: '44px' }}>My Bookings</button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
