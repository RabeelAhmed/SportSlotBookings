import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { LuCalendar, LuQrCode, LuDownload, LuX, LuTriangleAlert, LuPlus } from 'react-icons/lu';
import AuthContext from '../context/AuthContext';
import { formatHourLabel } from '../components/TimeSlotGrid';

const getSportInitials = (name = '') => {
  const lc = name.toLowerCase();
  if (lc.includes('cricket')) return 'CR';
  if (lc.includes('football')) return 'FB';
  return 'SP';
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
      } catch (_err) {
        toast.error('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [isAuthenticated, navigate, token]);

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

  // Derived filtered bookings
  const filteredBookings = bookings.filter((b) => {
    if (filter === 'All') return true;
    if (filter === 'Upcoming') return b.status === 'confirmed' || b.status === 'pending_payment';
    if (filter === 'Completed') return b.status === 'completed';
    if (filter === 'Cancelled') return b.status === 'cancelled';
    return true;
  });

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-base)', color: 'var(--accent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font)', fontSize: '14px' }}>
          <span className="spinner" />
          <span>Loading your bookings...</span>
        </div>
      </div>
    );
  }

  // Page motion variants
  const pageVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.25, ease: 'easeOut' } 
    }
  };

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } }
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
        paddingBottom: '64px'
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
              My Bookings
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              Manage and view your court reservations.
            </p>
          </div>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LuPlus size={16} />
              Book a Court
            </button>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          borderBottom: '1px solid var(--border)', 
          marginBottom: '24px',
          overflowX: 'auto',
          scrollbarWidth: 'none'
        }}>
          {['All', 'Upcoming', 'Completed', 'Cancelled'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                borderBottom: filter === f ? '2px solid var(--accent)' : '2px solid transparent',
                color: filter === f ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: filter === f ? 500 : 400,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                outline: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Booking Cards Container */}
        <AnimatePresence mode="popLayout">
          {filteredBookings.length > 0 ? (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              {filteredBookings.map((b) => {
                const bookingDateObj = new Date(b.date);
                bookingDateObj.setHours(b.startTime, 0, 0, 0);
                const hoursDifference = (bookingDateObj.getTime() - new Date().getTime()) / (1000 * 60 * 60);
                const isFuture = hoursDifference > 0;
                const canCancel = hoursDifference >= 4 && b.status === 'confirmed';

                let badgeClass = 'badge-completed';
                if (b.status === 'confirmed') badgeClass = 'badge-confirmed';
                if (b.status === 'pending_payment') badgeClass = 'badge-pending';
                if (b.status === 'cancelled') badgeClass = 'badge-cancelled';

                return (
                  <motion.div
                    key={b._id}
                    variants={pageVariants}
                    layout
                    className="card"
                    style={{
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      boxShadow: 'var(--shadow)'
                    }}
                  >
                    {/* Top Row: Icon + Details + Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* Initials badge */}
                        <div style={{ 
                          width: '48px', 
                          height: '48px', 
                          borderRadius: '50%', 
                          backgroundColor: 'var(--bg-elevated)', 
                          border: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--text-primary)'
                        }}>
                          {getSportInitials(b.sport?.name)}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                            {b.sport?.name}
                          </h3>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                            {new Date(b.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} &bull; {formatHourLabel(b.startTime)} &ndash; {formatHourLabel(b.endTime)}
                          </div>
                        </div>
                      </div>

                      <span className={`badge ${badgeClass}`}>
                        {b.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Metadata strip */}
                    <div style={{ 
                      backgroundColor: 'var(--bg-elevated)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '8px', 
                      padding: '12px 16px', 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                      gap: '12px' 
                    }}>
                      <div>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', display: 'block', marginBottom: '2px' }}>Duration</span>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{b.durationHours} hr{b.durationHours > 1 ? 's' : ''}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', display: 'block', marginBottom: '2px' }}>Total Price</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Rs. {b.totalPrice.toLocaleString()}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', display: 'block', marginBottom: '2px' }}>Reference</span>
                        <span className="mono-chip" style={{ fontSize: '12px', padding: '2px 6px' }}>{b.bookingReference || b._id.slice(-8).toUpperCase()}</span>
                      </div>
                    </div>

                    {/* Actions Strip */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                      <Link to={`/booking/${b._id}`} style={{ textDecoration: 'none' }}>
                        <button className="btn-secondary" style={{ height: '32px', fontSize: '13px' }}>
                          View Details
                        </button>
                      </Link>
                      
                      {b.status === 'confirmed' && isFuture && (
                        <button 
                          onClick={() => setQrModal({ isOpen: true, booking: b })} 
                          className="btn-primary" 
                          style={{ height: '32px', fontSize: '13px', gap: '6px' }}
                        >
                          <LuQrCode size={14} />
                          Show QR
                        </button>
                      )}
                      
                      {canCancel && (
                        <button 
                          onClick={() => setCancelModal({ isOpen: true, bookingId: b._id })} 
                          className="btn-destructive" 
                          style={{ height: '32px', fontSize: '13px' }}
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ 
                textAlign: 'center', 
                padding: '64px 24px', 
                backgroundColor: 'var(--bg-surface)', 
                border: '1px dashed var(--border)', 
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <div style={{ color: 'var(--text-muted)' }}>
                <LuCalendar size={48} strokeWidth={1.5} />
              </div>
              <div>
                <h2 style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0' }}>
                  No Bookings Found
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                  You don't have any bookings matching this filter.
                </p>
              </div>
              <Link to="/" style={{ textDecoration: 'none' }}>
                <button className="btn-primary">
                  Book a Slot
                </button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* QR Modal */}
      <AnimatePresence>
        {qrModal.isOpen && qrModal.booking && (
          <div className="modal-overlay" onClick={() => setQrModal({ isOpen: false, booking: null })}>
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="modal-content"
              style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Court Entrance QR</span>
                <button 
                  onClick={() => setQrModal({ isOpen: false, booking: null })}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  <LuX size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  backgroundColor: '#FFFFFF', 
                  padding: '12px', 
                  borderRadius: '12px', 
                  display: 'inline-flex',
                  boxShadow: 'var(--shadow)'
                }}>
                  {qrModal.booking.qrCode ? (
                    <img src={qrModal.booking.qrCode} alt="QR Code" style={{ width: '200px', height: '200px', display: 'block' }} />
                  ) : (
                    <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      QR Code Not Generated
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 500 }}>
                  Show this QR code at the reception desk
                </span>
              </div>

              <div style={{ 
                backgroundColor: 'var(--bg-elevated)', 
                border: '1px solid var(--border)', 
                borderRadius: '8px', 
                padding: '12px', 
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Reference</span>
                  <span className="mono-chip" style={{ fontSize: '11px', padding: '1px 5px' }}>{qrModal.booking.bookingReference || qrModal.booking._id.slice(-8).toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Court Time</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{formatHourLabel(qrModal.booking.startTime)} &ndash; {formatHourLabel(qrModal.booking.endTime)}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                <button 
                  onClick={() => handleDownloadQR(qrModal.booking.qrCode, qrModal.booking.bookingReference || qrModal.booking._id.slice(-8))} 
                  className="btn-primary"
                  style={{ gap: '6px' }}
                >
                  <LuDownload size={14} />
                  Download
                </button>
                <button onClick={() => setQrModal({ isOpen: false, booking: null })} className="btn-secondary">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {cancelModal.isOpen && (
          <div className="modal-overlay" onClick={() => setCancelModal({ isOpen: false, bookingId: null })}>
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="modal-content"
              style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--danger)', marginTop: '8px' }}>
                <LuTriangleAlert size={40} />
              </div>
              
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                  Cancel Booking?
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                  Are you sure you want to cancel this booking? If the reservation is more than 4 hours away, you will receive a 70% refund.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                <button onClick={handleCancelConfirm} className="btn-destructive">
                  Yes, Cancel
                </button>
                <button onClick={() => setCancelModal({ isOpen: false, bookingId: null })} className="btn-secondary">
                  No, Keep it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MyBookingsPage;
