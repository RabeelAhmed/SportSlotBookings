import { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { LuClock, LuArrowLeft } from 'react-icons/lu';
import AuthContext from '../context/AuthContext';
import { formatHourLabel } from '../components/TimeSlotGrid';

// Stripe test card: 4242 4242 4242 4242 | Expiry: 12/29 | CVC: 123 | ZIP: 10001
// This is a Stripe test card — it will NEVER charge real money.

const LockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, opacity: 0.7 }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const PAYMENT_METHODS = [
  { id: 'easypaisa', name: 'Easypaisa', subLabel: 'Manual transfer · 03436324197', badge: 'Manual', badgeColor: 'var(--warning)', badgeBg: 'var(--warning-muted)' },
  { id: 'jazzcash', name: 'JazzCash', subLabel: 'Manual transfer · 03084739209', badge: 'Manual', badgeColor: 'var(--warning)', badgeBg: 'var(--warning-muted)' },
  { id: 'stripe_card', name: 'Credit or Debit Card', subLabel: 'Visa, Mastercard · Secured by Stripe', badge: 'Instant', badgeColor: 'var(--success)', badgeBg: 'var(--success-muted)', showLock: true },
];

const BookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useContext(AuthContext);
  const state = location.state || {};
  const { sportId, sportName, date, startHour, endHour, price } = state;
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [walletNumber, setWalletNumber] = useState('');
  const [timeLeft, setTimeLeft] = useState(600);

  useEffect(() => {
    if (!isAuthenticated) { toast.error('Please login to book.'); navigate('/login'); return; }
    if (!sportId || startHour === undefined || endHour === undefined) { toast.error('Invalid booking details.'); navigate('/'); return; }
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timer); toast.error('Booking session expired.'); navigate('/sport/' + sportId); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [sportId, startHour, endHour, isAuthenticated, navigate]);

  if (!sportId || startHour === undefined || endHour === undefined) return null;

  const duration = endHour - startHour;
  let offPeakHours = 0, peakHours = 0;
  for (let h = startHour; h < endHour; h++) {
    if (h >= 9 && h < 17) offPeakHours++;
    else if (h >= 17 && h < 25) peakHours++;
  }

  const displayDate = new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const formatTimerDisplay = (s) => `${Math.floor(s/60)}:${(s%60)<10?'0':''}${s%60}`;
  const isTimerDanger = timeLeft <= 180;

  const handleManualPayment = async () => {
    if (!walletNumber || walletNumber.trim().length < 10) {
      toast.error('Please enter a valid mobile number.');
      return;
    }
    setLoading(true);
    try {
      // Simulate mobile wallet API delay (e.g. USSD/Push notification prompt)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const { data } = await axios.post(
        '/api/bookings',
        { sportId, date, startTime: startHour, endTime: endHour, paymentMethod, walletNumber },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Payment completed successfully!');
      navigate(`/booking/${data._id}`);
    } catch (err) {
      const errData = err.response?.data;
      const msg = errData?.message || errData?.errors?.[0]?.msg || 'Failed to create booking.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleStripePayment = async () => {
    setStripeLoading(true);
    try {
      const { data: booking } = await axios.post('/api/bookings', { sportId, date, startTime: startHour, endTime: endHour, paymentMethod: 'stripe_card' }, { headers: { Authorization: `Bearer ${token}` } });
      const { data: session } = await axios.post('/api/payments/create-checkout-session', { bookingId: booking._id }, { headers: { Authorization: `Bearer ${token}` } });
      window.location.href = session.sessionUrl;
    } catch (err) {
      const errData = err.response?.data;
      const msg = errData?.message || errData?.errors?.[0]?.msg || 'Failed to start checkout.';
      toast.error(msg);
      setStripeLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!paymentMethod) { toast.error('Please select a payment method.'); return; }
    if (paymentMethod === 'stripe_card') handleStripePayment();
    else handleManualPayment();
  };

  const labelStyle = { fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' };
  const valueStyle = { fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', paddingTop: '56px', paddingBottom: '48px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 24px 0' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer', padding: 0 }}>
          <LuArrowLeft size={16} /> Back
        </button>
      </div>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px' }}>
        <div style={{ height: '40px', padding: '0 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500, marginBottom: '24px', backgroundColor: isTimerDanger ? 'var(--danger-muted)' : 'var(--warning-muted)', border: `1px solid ${isTimerDanger ? 'var(--danger)' : 'var(--warning)'}`, color: isTimerDanger ? 'var(--danger)' : 'var(--warning)' }}>
          <LuClock size={16} /><span>Time left to complete booking: {formatTimerDisplay(timeLeft)}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '360px minmax(0, 1fr)', gap: '48px', alignItems: 'start' }} className="booking-split">
          {/* Left: Summary */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div><h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Review Details</h3><hr className="card-divider" /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[['Sport', sportName], ['Date', displayDate], ['Time', `${formatHourLabel(startHour)} – ${formatHourLabel(endHour)}`], ['Duration', `${duration} hour${duration > 1 ? 's' : ''}`]].map(([label, value], i) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={labelStyle}>{label}</span><span style={valueStyle}>{value}</span></div>
                  {i < 3 && <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', marginTop: '12px' }} />}
                </div>
              ))}
            </div>
            <hr className="card-divider" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={labelStyle}>Rate Breakdown</span>
              {offPeakHours > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}><span>Off-Peak (9AM–5PM)</span><span>{offPeakHours} hr{offPeakHours > 1 ? 's' : ''} × Rs. 1,000</span></div>}
              {peakHours > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}><span>Peak (5PM–1AM)</span><span>{peakHours} hr{peakHours > 1 ? 's' : ''} × Rs. 1,500</span></div>}
            </div>
            <hr className="card-divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Total Price</span>
              <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--accent)' }}>Rs. {(price || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Right: Payment */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Select Payment Method</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>Choose how you want to pay for this booking.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {PAYMENT_METHODS.map((method) => {
                  const isSelected = paymentMethod === method.id;
                  return (
                    <button key={method.id} id={`payment-method-${method.id}`} onClick={() => setPaymentMethod(method.id)}
                      style={{ background: isSelected ? 'var(--accent-muted)' : 'var(--bg-surface)', border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '10px', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', transition: 'all 0.15s', outline: 'none', width: '100%' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0, border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`, background: isSelected ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isSelected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{method.name}</span>
                          {method.showLock && <LockIcon />}
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{method.subLabel}</span>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', color: method.badgeColor, background: method.badgeBg, flexShrink: 0 }}>{method.badge}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Instructions / CTA */}
            {paymentMethod && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                className="card" style={{ borderStyle: 'dashed', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {paymentMethod === 'stripe_card' ? 'Secure Card Payment' : 'Transfer Instructions'}
                  </h3>
                  <hr className="card-divider" />
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {(paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <p style={{ margin: '0 0 6px 0' }}>Send Rs. {(price || 0).toLocaleString()} directly via checkout:</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Enter your {paymentMethod === 'easypaisa' ? 'Easypaisa' : 'JazzCash'} Mobile Number:
                          </label>
                          <input
                            type="tel"
                            placeholder="e.g. 03436324197"
                            value={walletNumber}
                            onChange={(e) => setWalletNumber(e.target.value)}
                            style={{
                              width: '100%',
                              height: '40px',
                              background: 'var(--bg-base)',
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              padding: '0 12px',
                              color: 'var(--text-primary)',
                              fontSize: '14px',
                              outline: 'none',
                              transition: 'border-color 0.2s',
                            }}
                            required
                          />
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                        Enter your mobile number and click below. A simulated prompt will confirm your transaction instantly.
                      </p>
                    </div>
                  )}
                  {paymentMethod === 'stripe_card' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <p style={{ margin: 0 }}>Pay securely with your card via Stripe. You will be redirected to a hosted payment page.</p>
                      <div style={{ background: 'var(--bg-base)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        🧪 <strong style={{ color: 'var(--text-secondary)' }}>Test card:</strong> 4242 4242 4242 4242 &middot; Exp: 12/29 &middot; CVC: 123 &middot; ZIP: 10001
                        <br /><span style={{ fontSize: '11px' }}>This card will never charge real money in test mode.</span>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: '4px' }}>
                  {stripeLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', height: '44px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                      <span className="spinner" /><span>Preparing secure checkout...</span>
                    </div>
                  ) : (
                    <button id="booking-confirm-btn" onClick={handleConfirm} disabled={loading || stripeLoading} className="btn-primary" style={{ width: '100%', height: '44px', fontSize: '15px' }}>
                      {loading ? (
                        <><span className="spinner" /><span>Processing payment...</span></>
                      ) : paymentMethod === 'stripe_card' ? (
                        `Pay Rs. ${(price || 0).toLocaleString()} Now`
                      ) : (
                        `Pay Rs. ${(price || 0).toLocaleString()} with ${paymentMethod === 'easypaisa' ? 'Easypaisa' : 'JazzCash'}`
                      )}
                    </button>
                  )}
                </div>
                {paymentMethod !== 'stripe_card' && (
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    A push authorization code will be simulated for validation.
                  </p>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 768px) { .booking-split { grid-template-columns: 1fr !important; gap: 32px !important; } }`}</style>
    </motion.div>
  );
};

export default BookingPage;
