import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

const getSportIcon = (name = '') => {
  const lc = name.toLowerCase();
  if (lc.includes('cricket')) return '🏏';
  if (lc.includes('football')) return '⚽';
  return '🏟️';
};

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useContext(AuthContext);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  // Modals state
  const [qrModal, setQrModal] = useState({ isOpen: false, booking: null });
  const [cancelModal, setCancelModal] = useState({ isOpen: false, bookingId: null });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchBookings = async () => {
      try {
        const { data } = await axios.get('/api/bookings/my-bookings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBookings(data);
      } catch (err) {
        toast.error('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [isAuthenticated, navigate, token]);

  // Derived filtered bookings
  const filteredBookings = bookings.filter((b) => {
    if (filter === 'All') return true;
    if (filter === 'Upcoming') return b.status === 'confirmed' || b.status === 'pending_payment';
    if (filter === 'Completed') return b.status === 'completed';
    if (filter === 'Cancelled') return b.status === 'cancelled';
    return true;
  });

  const handleCancelConfirm = async () => {
    try {
      const { data } = await axios.put(`/api/bookings/${cancelModal.bookingId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBookings((prev) => prev.map(b => b._id === data._id ? data : b));
      toast.success('Booking cancelled successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancelModal({ isOpen: false, bookingId: null });
    }
  };

  const handleDownloadQR = (qrCode, ref) => {
    if (!qrCode) return;
    const a = document.createElement('a');
    a.href = qrCode;
    a.download = `booking-qr-${ref}.png`;
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

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Inter', sans-serif", paddingTop: '90px', paddingBottom: '60px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#F0F0F5', margin: '0 0 0.5rem 0' }}>My Bookings</h1>
            <p style={{ color: '#9898B0', fontSize: '1rem', margin: 0 }}>Welcome back, <span style={{ color: '#00FF87', fontWeight: 700 }}>{user?.name}</span>!</p>
          </div>
          <Link to="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg,#00FF87,#00cc6a)', color: '#0A0A0F', fontWeight: 700, border: 'none', borderRadius: '999px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
            >
              + New Booking
            </motion.button>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1.5rem', scrollbarWidth: 'none' }}>
          {['All', 'Upcoming', 'Completed', 'Cancelled'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.6rem 1.25rem',
                background: filter === f ? 'rgba(0,255,135,0.1)' : 'rgba(255,255,255,0.05)',
                border: filter === f ? '1px solid #00FF87' : '1px solid rgba(255,255,255,0.1)',
                color: filter === f ? '#00FF87' : '#9898B0',
                borderRadius: '999px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Booking Cards */}
        <AnimatePresence mode="popLayout">
          {filteredBookings.length > 0 ? (
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {filteredBookings.map((b) => {
                const bookingDateObj = new Date(b.date);
                bookingDateObj.setHours(b.startTime, 0, 0, 0);
                const hoursDifference = (bookingDateObj.getTime() - new Date().getTime()) / (1000 * 60 * 60);
                const isFuture = hoursDifference > 0;
                const canCancel = hoursDifference >= 4 && b.status === 'confirmed';

                return (
                  <motion.div
                    key={b._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{
                      background: '#13131A',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '1.25rem',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.25rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ fontSize: '2.5rem', background: 'rgba(255,255,255,0.05)', width: '60px', height: '60px', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {getSportIcon(b.sport?.name)}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F0F0F5', margin: '0 0 0.25rem 0' }}>{b.sport?.name}</h3>
                          <div style={{ color: '#9898B0', fontSize: '0.85rem' }}>
                            {new Date(b.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • {formatHour(b.startTime)} to {formatHour(b.endTime)}
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {b.status === 'pending_payment' && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,200,0,0.1)', color: '#FFC800', padding: '0.4rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(255,200,0,0.2)' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFC800', animation: 'pulse 1.5s infinite' }}></div>
                            Pending Payment
                          </div>
                        )}
                        {b.status === 'confirmed' && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(0,255,135,0.1)', color: '#00FF87', padding: '0.4rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(0,255,135,0.2)' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00FF87' }}></div>
                            Confirmed
                          </div>
                        )}
                        {b.status === 'cancelled' && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,80,80,0.1)', color: '#FF5050', padding: '0.4rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(255,80,80,0.2)' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF5050' }}></div>
                            Cancelled
                          </div>
                        )}
                        {b.status === 'completed' && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.1)', color: '#9898B0', padding: '0.4rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9898B0' }}></div>
                            Completed
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#9898B0', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Duration</div>
                        <div style={{ color: '#F0F0F5', fontWeight: 600, fontSize: '0.9rem' }}>{b.durationHours} hr{b.durationHours > 1 ? 's' : ''}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#9898B0', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Total Price</div>
                        <div style={{ color: '#00FF87', fontWeight: 700, fontSize: '0.9rem' }}>Rs. {b.totalPrice.toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#9898B0', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Ref ID</div>
                        <div style={{ color: '#F0F0F5', fontWeight: 600, fontSize: '0.9rem', fontFamily: 'monospace' }}>{b.bookingReference || b._id.slice(-8).toUpperCase()}</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                      <Link to={`/booking/${b._id}`} style={{ textDecoration: 'none' }}>
                        <button style={{ padding: '0.6rem 1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#F0F0F5', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                          View Details
                        </button>
                      </Link>
                      
                      {b.status === 'confirmed' && isFuture && (
                        <button onClick={() => setQrModal({ isOpen: true, booking: b })} style={{ padding: '0.6rem 1rem', background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.3)', color: '#00FF87', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                          Show QR
                        </button>
                      )}
                      
                      {canCancel && (
                        <button onClick={() => setCancelModal({ isOpen: true, bookingId: b._id })} style={{ padding: '0.6rem 1rem', background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', color: '#FF5050', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ textAlign: 'center', padding: '4rem 2rem', background: '#13131A', borderRadius: '1.5rem', border: '1px dashed rgba(255,255,255,0.1)' }}
            >
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🕵️</div>
              <h2 style={{ color: '#F0F0F5', marginBottom: '0.5rem', fontSize: '1.5rem' }}>No bookings yet</h2>
              <p style={{ color: '#9898B0', marginBottom: '2rem' }}>You don't have any {filter.toLowerCase()} bookings at the moment.</p>
              <Link to="/">
                <button style={{ padding: '0.85rem 1.5rem', background: 'linear-gradient(135deg,#00FF87,#00cc6a)', border: 'none', color: '#0A0A0F', fontWeight: 700, borderRadius: '999px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                  Book your first slot!
                </button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* QR Modal */}
      <AnimatePresence>
        {qrModal.isOpen && qrModal.booking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
            onClick={() => setQrModal({ isOpen: false, booking: null })}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: '#13131A', border: '1px solid rgba(0,255,135,0.2)', borderRadius: '1.5rem', padding: '2.5rem 2rem', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}
            >
              <h2 style={{ color: '#F0F0F5', margin: '0 0 0.5rem 0' }}>Court Entrance QR</h2>
              <p style={{ color: '#9898B0', fontSize: '0.9rem', marginBottom: '2rem' }}>Show this at the reception</p>
              
              <div style={{ background: '#fff', padding: '1rem', borderRadius: '1rem', display: 'inline-block', marginBottom: '1.5rem' }}>
                {qrModal.booking.qrCode ? (
                  <img src={qrModal.booking.qrCode} alt="QR Code" style={{ width: '200px', height: '200px', display: 'block' }} />
                ) : (
                  <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', background: '#eee' }}>No QR Generated</div>
                )}
              </div>
              
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#9898B0', fontSize: '0.85rem' }}>Ref ID</span>
                  <span style={{ color: '#F0F0F5', fontSize: '0.85rem', fontFamily: 'monospace' }}>{qrModal.booking.bookingReference || qrModal.booking._id.slice(-8).toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9898B0', fontSize: '0.85rem' }}>Time</span>
                  <span style={{ color: '#F0F0F5', fontSize: '0.85rem' }}>{formatHour(qrModal.booking.startTime)} - {formatHour(qrModal.booking.endTime)}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <button onClick={() => handleDownloadQR(qrModal.booking.qrCode, qrModal.booking.bookingReference || qrModal.booking._id.slice(-8))} style={{ width: '100%', padding: '0.85rem', background: 'linear-gradient(135deg,#00FF87,#00cc6a)', border: 'none', borderRadius: '0.75rem', color: '#0A0A0F', fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                  Download QR
                </button>
                <button onClick={() => setQrModal({ isOpen: false, booking: null })} style={{ width: '100%', padding: '0.85rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.75rem', color: '#F0F0F5', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {cancelModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{ background: '#13131A', border: '1px solid rgba(255,80,80,0.3)', borderRadius: '1.5rem', padding: '2.5rem 2rem', maxWidth: '360px', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
              <h2 style={{ color: '#F0F0F5', margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>Cancel Booking?</h2>
              <p style={{ color: '#9898B0', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.5 }}>
                Are you sure you want to cancel this booking? Since it is more than 4 hours away, you will receive a <strong style={{ color: '#FF5050' }}>70% refund</strong>.
              </p>
              
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <button onClick={handleCancelConfirm} style={{ width: '100%', padding: '0.85rem', background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: '0.75rem', color: '#FF5050', fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                  Yes, Cancel Booking
                </button>
                <button onClick={() => setCancelModal({ isOpen: false, bookingId: null })} style={{ width: '100%', padding: '0.85rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.75rem', color: '#F0F0F5', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                  No, Keep it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 200, 0, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(255, 200, 0, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 200, 0, 0); }
        }
      `}</style>
    </div>
  );
};

export default MyBookingsPage;
