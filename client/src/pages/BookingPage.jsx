import { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { LuClock, LuArrowLeft, LuCreditCard, LuWallet, LuLandmark } from 'react-icons/lu';
import AuthContext from '../context/AuthContext';
import { formatHourLabel } from '../components/TimeSlotGrid';

const BookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useContext(AuthContext);

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
      toast.error('Invalid booking details.');
      navigate('/');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error('Booking session expired.');
          navigate('/sport/' + sportId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sportId, startHour, endHour, isAuthenticated, navigate]);

  if (!sportId || startHour === undefined || endHour === undefined) {
    return null;
  }

  const duration = endHour - startHour;
  let offPeakHours = 0;
  let peakHours = 0;

  for (let h = startHour; h < endHour; h++) {
    if (h >= 9 && h < 17) offPeakHours++;
    else if (h >= 17 && h < 25) peakHours++;
  }

  const displayDate = new Date(date).toLocaleDateString('en-GB', {
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
          paymentMethod,
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

  // Determine timer color theme based on duration left (warn vs danger)
  const isTimerDanger = timeLeft <= 180; // 3 minutes warning
  const timerStyle = {
    height: '40px',
    padding: '0 12px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: 500,
    backgroundColor: isTimerDanger ? 'var(--danger-muted)' : 'var(--warning-muted)',
    border: `1px solid ${isTimerDanger ? 'var(--danger)' : 'var(--warning)'}`,
    color: isTimerDanger ? 'var(--danger)' : 'var(--warning)',
    marginBottom: '24px'
  };

  const labelStyle = {
    fontSize: '11px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#64748B'
  };

  const valueStyle = {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-primary)'
  };

  // Page entrance animation
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
        paddingBottom: '48px'
      }}
    >
      {/* Back button */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 24px 0' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '14px',
            cursor: 'pointer',
            padding: 0,
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <LuArrowLeft size={16} />
          Back
        </button>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px' }}>
        {/* Timer Bar */}
        <div style={timerStyle}>
          <LuClock size={16} />
          <span>Time left to complete booking: {formatTime(timeLeft)}</span>
        </div>

        {/* Split Grid */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: '360px minmax(0, 1fr)',
            gap: '48px',
            alignItems: 'start'
          }}
          className="booking-split"
        >
          {/* Left Column: Summary */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Review Details
              </h3>
              <hr className="card-divider" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={labelStyle}>Sport</span>
                <span style={valueStyle}>{sportName}</span>
              </div>
              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={labelStyle}>Date</span>
                <span style={valueStyle}>{displayDate}</span>
              </div>
              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={labelStyle}>Time</span>
                <span style={valueStyle}>{formatHourLabel(startHour)} &ndash; {formatHourLabel(endHour)}</span>
              </div>
              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={labelStyle}>Duration</span>
                <span style={valueStyle}>{duration} hour{duration > 1 ? 's' : ''}</span>
              </div>
            </div>

            <hr className="card-divider" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={labelStyle}>Rate Breakdown</span>
              {offPeakHours > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <span>Off-Peak (9AM - 5PM)</span>
                  <span>{offPeakHours} hr{offPeakHours > 1 ? 's' : ''} &times; Rs. 1,000</span>
                </div>
              )}
              {peakHours > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <span>Peak (5PM - 1AM)</span>
                  <span>{peakHours} hr{peakHours > 1 ? 's' : ''} &times; Rs. 1,500</span>
                </div>
              )}
            </div>

            <hr className="card-divider" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Total Price</span>
              <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--accent)' }}>
                Rs. {(price || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Right Column: Payment & Instructions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Selector */}
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Select Payment Method
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
                Choose a provider to view transfer account details.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                {[
                  { id: 'jazzcash', name: 'JazzCash', icon: <LuCreditCard size={18} /> },
                  { id: 'easypaisa', name: 'Easypaisa', icon: <LuWallet size={18} /> },
                  { id: 'bank_transfer', name: 'Bank Transfer', icon: <LuLandmark size={18} /> },
                ].map(method => {
                  const isSelected = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      style={{
                        background: isSelected ? 'var(--accent-muted)' : 'var(--bg-surface)',
                        border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: '8px',
                        padding: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.15s ease',
                        outline: 'none',
                        color: isSelected ? 'var(--accent)' : 'var(--text-secondary)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }
                      }}
                    >
                      {method.icon}
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{method.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Instruction Sheet */}
            {paymentMethod && (
              <div 
                className="card" 
                style={{ 
                  borderStyle: 'dashed',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    Transfer Instructions
                  </h3>
                  <hr className="card-divider" />
                </div>

                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {paymentMethod === 'jazzcash' && (
                    <p style={{ margin: 0 }}>
                      Send <strong style={{ color: 'var(--text-primary)' }}>Rs. {(price || 0).toLocaleString()}</strong> to number <strong style={{ color: 'var(--text-primary)' }}>0300-1234567</strong> (Account: SportSlot Court). Please enter the booking reference <span className="mono-chip" style={{ fontSize: '12px', padding: '2px 6px' }}>[REF]</span> in the transaction description.
                    </p>
                  )}
                  {paymentMethod === 'easypaisa' && (
                    <p style={{ margin: 0 }}>
                      Send <strong style={{ color: 'var(--text-primary)' }}>Rs. {(price || 0).toLocaleString()}</strong> to number <strong style={{ color: 'var(--text-primary)' }}>0345-1234567</strong> (Account: SportSlot Court). Please enter the booking reference <span className="mono-chip" style={{ fontSize: '12px', padding: '2px 6px' }}>[REF]</span> in the transaction description.
                    </p>
                  )}
                  {paymentMethod === 'bank_transfer' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <p style={{ margin: 0 }}>
                        Transfer <strong style={{ color: 'var(--text-primary)' }}>Rs. {(price || 0).toLocaleString()}</strong> to the following bank account:
                      </p>
                      <ul style={{ listStyleType: 'none', padding: 0, margin: '8px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <li>Bank: <strong style={{ color: 'var(--text-primary)' }}>Meezan Bank</strong></li>
                        <li>Account Name: <strong style={{ color: 'var(--text-primary)' }}>SportSlot Pvt Ltd</strong></li>
                        <li>Account Number: <strong style={{ color: 'var(--text-primary)' }}>0123 4567 8910</strong></li>
                        <li>Branch Code: <strong style={{ color: 'var(--text-primary)' }}>0123</strong></li>
                      </ul>
                      <p style={{ margin: 0 }}>
                        Please enter the booking reference <span className="mono-chip" style={{ fontSize: '12px', padding: '2px 6px' }}>[REF]</span> in the transaction reference box.
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '8px' }}>
                  <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="btn-primary"
                    style={{ width: '100%', height: '44px', fontSize: '15px' }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner" />
                        <span>Confirming booking...</span>
                      </>
                    ) : (
                      'I have made the payment'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .booking-split {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default BookingPage;
