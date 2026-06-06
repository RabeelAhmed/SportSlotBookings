import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  LuX,
  LuFileSpreadsheet,
  LuCompass
} from 'react-icons/lu';
import AuthContext from '../context/AuthContext';
import { formatHourLabel } from '../components/TimeSlotGrid';
import AdminSidebar from '../components/AdminSidebar';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, token, loading: authLoading } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location]);
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [filterSport, _setFilterSport] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [qrModal, setQrModal] = useState({ isOpen: false, qrCode: null });

  // Access control
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast.error('Access Denied');
      navigate('/');
    }
  }, [isAdmin, authLoading, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, bookingsRes] = await Promise.all([
        axios.get('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`/api/admin/bookings?sport=${filterSport}&status=${filterStatus}&date=${filterDate}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setStats(statsRes.data);
      setBookings(bookingsRes.data);
    } catch (_err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, filterSport, filterStatus, filterDate]);

  const handleConfirmPayment = async (id) => {
    try {
      const { data } = await axios.patch(`/api/admin/bookings/${id}/confirm-payment`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(prev => prev.map(b => b._id === id ? data : b));
      toast.success('Payment confirmed & QR generated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm payment');
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      const { data } = await axios.patch(`/api/admin/bookings/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(prev => prev.map(b => b._id === id ? data : b));
      toast.success('Booking cancelled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Ref', 'User Name', 'User Phone', 'Sport', 'Date', 'Start Time', 'End Time', 'Duration', 'Amount', 'Status'];
    const rows = bookings.map(b => [
      b.bookingReference || b._id.slice(-8).toUpperCase(),
      b.user?.name || 'N/A',
      b.user?.phone || 'N/A',
      b.sport?.name || 'N/A',
      b.date,
      formatHourLabel(b.startTime),
      formatHourLabel(b.endTime),
      b.durationHours,
      b.totalPrice,
      b.status
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bookings_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authLoading || !isAdmin) return null;

  const totalPages = Math.ceil(bookings.length / limit);
  const paginatedBookings = bookings.slice((page - 1) * limit, page * limit);

  const renderStatusBadge = (status) => {
    let badgeClass = 'badge-completed';
    if (status === 'confirmed') badgeClass = 'badge-confirmed';
    if (status === 'pending_payment') badgeClass = 'badge-pending';
    if (status === 'cancelled') badgeClass = 'badge-cancelled';
    return (
      <span className={`badge ${badgeClass}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const pageVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.25, ease: 'easeOut' } 
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'var(--font)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Dashboard container layout */}
      <div style={{ display: 'flex', flex: 1, paddingTop: '56px' }} className="admin-layout">
        
        {/* Reusable Admin Sidebar */}
        <AdminSidebar activeTab={activeTab} />

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--accent)' }}>
              <span className="spinner" />
              <span>Loading metrics...</span>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && stats && (
                <motion.div 
                  key="dashboard-tab"
                  variants={pageVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
                >
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      Overview
                    </h2>
                  </div>
                  
                  {/* Stats Cards (Flat style: label top, bold number below, no bg/border/shadow/icon) */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: '24px',
                    borderBottom: '1px solid var(--border-subtle)',
                    paddingBottom: '32px'
                  }} className="mobile-stats-grid">
                    {[
                      { label: "Today's Bookings", value: stats.todayBookings },
                      { label: "Today's Revenue", value: `Rs. ${stats.todayRevenue.toLocaleString()}` },
                      { label: "Pending Payments", value: stats.pendingPayments },
                      { label: "Total Users", value: stats.totalUsers },
                    ].map((stat, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: 500, 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.08em', 
                          color: '#64748B' 
                        }}>
                          {stat.label}
                        </span>
                        <span style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {stat.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Recent Bookings Table */}
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
                      Recent Bookings
                    </h3>
                    <div className="table-responsive" style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '12px' }}>
                      <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            {['Ref', 'User', 'Sport', 'Date', 'Time', 'Amount', 'Status'].map(h => (
                              <th key={h} style={{ padding: '16px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', fontWeight: 500 }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.slice(0, 10).map((b) => (
                            <tr key={b._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                              <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '12px' }}>
                                {b.bookingReference || b._id.slice(-8).toUpperCase()}
                              </td>
                              <td style={{ padding: '16px', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                                {b.user?.name || 'N/A'}
                              </td>
                              <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                {b.sport?.name}
                              </td>
                              <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                {b.date}
                              </td>
                              <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                {formatHourLabel(b.startTime)} &ndash; {formatHourLabel(b.endTime)}
                              </td>
                              <td style={{ padding: '16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                Rs. {b.totalPrice.toLocaleString()}
                              </td>
                              <td style={{ padding: '16px' }}>
                                {renderStatusBadge(b.status)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Bookings Tab */}
              {activeTab === 'bookings' && (
                <motion.div 
                  key="bookings-tab"
                  variants={pageVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      Bookings Management
                    </h2>
                    <button 
                      onClick={handleExportCSV} 
                      className="btn-secondary" 
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '36px', padding: '0 16px', fontSize: '13px' }}
                    >
                      <LuFileSpreadsheet size={16} />
                      Export CSV
                    </button>
                  </div>

                  {/* Filters Bar */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select 
                      value={filterStatus} 
                      onChange={(e) => setFilterStatus(e.target.value)} 
                      style={{ 
                        padding: '8px 12px', 
                        background: 'var(--bg-surface)', 
                        border: '1px solid var(--border)', 
                        color: 'var(--text-primary)', 
                        borderRadius: '8px', 
                        outline: 'none',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="All">All Statuses</option>
                      <option value="pending_payment">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    
                    <input 
                      type="date" 
                      value={filterDate} 
                      onChange={(e) => setFilterDate(e.target.value)} 
                      style={{ 
                        padding: '8px 12px', 
                        background: 'var(--bg-surface)', 
                        border: '1px solid var(--border)', 
                        color: 'var(--text-primary)', 
                        borderRadius: '8px', 
                        outline: 'none', 
                        fontSize: '13px',
                        colorScheme: 'dark',
                        cursor: 'pointer'
                      }} 
                    />
                  </div>

                  {/* Bookings Table */}
                  <div className="table-responsive" style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '12px' }}>
                    <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          {['Ref', 'User', 'Phone', 'Sport', 'Date / Time', 'Amount', 'Status', 'Actions'].map(h => (
                            <th key={h} style={{ padding: '16px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', fontWeight: 500 }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedBookings.length > 0 ? paginatedBookings.map((b) => (
                          <tr key={b._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '12px' }}>
                              {b.bookingReference || b._id.slice(-8).toUpperCase()}
                            </td>
                            <td style={{ padding: '16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {b.user?.name || 'N/A'}
                            </td>
                            <td style={{ padding: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {b.user?.phone || 'N/A'}
                            </td>
                            <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                              {b.sport?.name}
                            </td>
                            <td style={{ padding: '16px', fontSize: '12px' }}>
                              <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{b.date}</div>
                              <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{formatHourLabel(b.startTime)} &ndash; {formatHourLabel(b.endTime)} ({b.durationHours}h)</div>
                            </td>
                            <td style={{ padding: '16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              Rs. {b.totalPrice.toLocaleString()}
                            </td>
                            <td style={{ padding: '16px' }}>
                              {renderStatusBadge(b.status)}
                            </td>
                            <td style={{ padding: '16px' }}>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {b.status === 'pending_payment' && (
                                  <button 
                                    onClick={() => handleConfirmPayment(b._id)} 
                                    className="btn-primary"
                                    style={{ height: '28px', padding: '0 10px', fontSize: '12px' }}
                                  >
                                    Confirm
                                  </button>
                                )}
                                {(b.status === 'confirmed' || b.status === 'pending_payment') && (
                                  <button 
                                    onClick={() => handleCancelBooking(b._id)} 
                                    className="btn-destructive"
                                    style={{ height: '28px', padding: '0 10px', fontSize: '12px' }}
                                  >
                                    Cancel
                                  </button>
                                )}
                                {b.qrCode && (
                                  <button 
                                    onClick={() => setQrModal({ isOpen: true, qrCode: b.qrCode })} 
                                    className="btn-secondary"
                                    style={{ height: '28px', padding: '0 10px', fontSize: '12px' }}
                                  >
                                    View QR
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="8" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                              No bookings found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Control */}
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
                      <button 
                        onClick={() => setPage(p => Math.max(1, p - 1))} 
                        disabled={page === 1} 
                        className="btn-secondary"
                        style={{ height: '32px', padding: '0 12px', fontSize: '13px', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}
                      >
                        Prev
                      </button>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
                      <button 
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                        disabled={page === totalPages} 
                        className="btn-secondary"
                        style={{ height: '32px', padding: '0 12px', fontSize: '13px', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}
                      >
                        Next
                      </button>
                    </div>
                  )}

                </motion.div>
              )}

              {/* Placedholders for QR or Sports tabs */}
              {(activeTab === 'qr' || activeTab === 'sports') && (
                <motion.div 
                  key="other-tabs"
                  variants={pageVariants}
                  initial="hidden"
                  animate="visible"
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
                    <LuCompass size={48} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                      Module Coming Soon
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                      This administrative tab is currently under development.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

        </main>
      </div>

      {/* QR Modal (used by admin to check payment code) */}
      <AnimatePresence>
        {qrModal.isOpen && (
          <div className="modal-overlay" onClick={() => setQrModal({ isOpen: false, qrCode: null })}>
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="modal-content"
              style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Booking QR Code</span>
                <button 
                  onClick={() => setQrModal({ isOpen: false, qrCode: null })}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  <LuX size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ 
                  backgroundColor: '#FFFFFF', 
                  padding: '12px', 
                  borderRadius: '12px', 
                  display: 'inline-flex',
                  boxShadow: 'var(--shadow)'
                }}>
                  <img src={qrModal.qrCode} alt="QR Code" style={{ width: '200px', height: '200px', display: 'block' }} />
                </div>
              </div>

              <button 
                onClick={() => setQrModal({ isOpen: false, qrCode: null })} 
                className="btn-secondary"
                style={{ width: '100%', marginTop: '8px' }}
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Responsive mobile nav overrides */}
      <style>{`
        @media (max-width: 768px) {
          .admin-layout { flex-direction: column !important; }
          .admin-sidebar { 
            width: 100% !important; 
            flex-direction: row !important; 
            overflow-x: auto; 
            border-right: none !important; 
            border-bottom: 1px solid var(--border); 
            padding: 12px !important; 
          }
          .admin-sidebar button { 
            padding: 8px 12px !important; 
            border-radius: 6px !important; 
          }
          .mobile-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
