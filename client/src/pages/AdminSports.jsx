import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  LuPlus, 
  LuBan, 
  LuLoaderCircle, 
  LuX,
  LuActivity,
  LuCircleAlert
} from 'react-icons/lu';
import AuthContext from '../context/AuthContext';
import AdminSidebar from '../components/AdminSidebar';
import { formatHourLabel } from '../components/TimeSlotGrid';

const AdminSports = () => {
  const navigate = useNavigate();
  const { isAdmin, token, loading: authLoading } = useContext(AuthContext);

  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  // Add Sport Form state
  const [newSport, setNewSport] = useState({ name: '', description: '', image: '', isActive: true });
  const [addLoading, setAddLoading] = useState(false);

  // Block Slot Form state
  const [blockData, setBlockData] = useState({
    sportId: '',
    date: '',
    startTime: 9,
    endTime: 10
  });
  const [blockLoading, setBlockLoading] = useState(false);

  // Access control
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast.error('Access Denied');
      navigate('/');
    }
  }, [isAdmin, authLoading, navigate]);

  const fetchSports = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/sports?all=true', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSports(data);
      if (data.length > 0 && !blockData.sportId) {
        setBlockData(prev => ({ ...prev, sportId: data[0]._id }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load sports list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchSports();
      // Set default date for block to today
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      setBlockData(prev => ({ ...prev, date: todayStr }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleToggleSport = async (id) => {
    try {
      const { data } = await axios.put(`/api/sports/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSports(prev => prev.map(s => s._id === id ? data : s));
      toast.success(`${data.name} status updated to ${data.isActive ? 'Active' : 'Inactive'}`);
    } catch (err) {
      toast.error('Failed to update sport status');
    }
  };

  const handleAddSportSubmit = async (e) => {
    e.preventDefault();
    if (!newSport.name.trim()) {
      toast.error('Sport name is required');
      return;
    }
    try {
      setAddLoading(true);
      const { data } = await axios.post('/api/sports', newSport, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSports(prev => [...prev, data]);
      setIsAddModalOpen(false);
      setNewSport({ name: '', description: '', image: '', isActive: true });
      toast.success(`Sport "${data.name}" added successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add sport');
    } finally {
      setAddLoading(false);
    }
  };

  const handleBlockSubmit = async (e) => {
    e.preventDefault();
    const start = parseInt(blockData.startTime);
    const end = parseInt(blockData.endTime);

    if (!blockData.sportId || !blockData.date) {
      toast.error('Please select a sport and date');
      return;
    }

    if (start >= end) {
      toast.error('End hour must be after start hour');
      return;
    }

    try {
      setBlockLoading(true);
      await axios.post('/api/admin/bookings/block', {
        sportId: blockData.sportId,
        date: blockData.date,
        startTime: start,
        endTime: end
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Time slot blocked successfully');
      setIsBlockModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to block time slot');
    } finally {
      setBlockLoading(false);
    }
  };

  const startHours = Array.from({ length: 16 }, (_, i) => i + 9); // 9 to 24 (9 AM to 12 AM)
  const endHours = Array.from({ length: 16 }, (_, i) => i + 10); // 10 to 25 (10 AM to 1 AM)

  if (authLoading || !isAdmin) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'var(--font)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flex: 1, paddingTop: '56px' }} className="admin-layout">
        <AdminSidebar activeTab="sports" />

        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          
          {/* Header Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Sports & Fields
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0 0' }}>
                Configure sports offerings and system time blocks
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setIsBlockModalOpen(true)} 
                className="btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '38px', padding: '0 16px', fontSize: '13px' }}
              >
                <LuBan size={16} />
                Block Time Slot
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)} 
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '38px', padding: '0 16px', fontSize: '13px' }}
              >
                <LuPlus size={16} />
                Add New Sport
              </button>
            </div>
          </div>

          {/* Sports Table List */}
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--accent)', padding: '24px' }}>
              <span className="spinner" />
              <span>Loading sports database...</span>
            </div>
          ) : (
            <div className="table-responsive" style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Image', 'Sport Name', 'Description', 'Status Toggle', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '16px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', fontWeight: 500 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sports.length > 0 ? sports.map((sport) => (
                    <tr key={sport._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '16px', width: '80px' }}>
                        <div style={{ 
                          width: '56px', 
                          height: '56px', 
                          borderRadius: '8px', 
                          overflow: 'hidden', 
                          border: '1px solid var(--border)',
                          backgroundColor: '#0c0c10'
                        }}>
                          {sport.image ? (
                            <img src={sport.image} alt={sport.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                              <LuActivity size={20} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', width: '180px' }}>
                        {sport.name}
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)', maxTransform: 'none', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sport.description || 'No description provided.'}
                      </td>
                      <td style={{ padding: '16px', width: '120px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          
                          {/* CSS Switch Toggle */}
                          <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px' }}>
                            <input 
                              type="checkbox" 
                              checked={sport.isActive} 
                              onChange={() => handleToggleSport(sport._id)}
                              style={{ opacity: 0, width: 0, height: 0 }} 
                            />
                            <span style={{
                              position: 'absolute',
                              cursor: 'pointer',
                              top: 0, left: 0, right: 0, bottom: 0,
                              backgroundColor: sport.isActive ? 'var(--success)' : 'var(--neutral)',
                              borderRadius: '22px',
                              transition: '0.2s',
                            }}>
                              <span style={{
                                position: 'absolute',
                                height: '16px', width: '16px',
                                left: sport.isActive ? '19px' : '3px',
                                bottom: '3px',
                                backgroundColor: '#FFFFFF',
                                borderRadius: '50%',
                                transition: '0.2s',
                              }} />
                            </span>
                          </label>

                          <span style={{ 
                            fontSize: '12px', 
                            fontWeight: 500, 
                            color: sport.isActive ? 'var(--success)' : 'var(--text-muted)' 
                          }}>
                            {sport.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', width: '150px' }}>
                        <button 
                          className="btn-secondary" 
                          onClick={() => {
                            setBlockData(prev => ({ ...prev, sportId: sport._id }));
                            setIsBlockModalOpen(true);
                          }}
                          style={{ height: '30px', padding: '0 10px', fontSize: '12px' }}
                        >
                          Block Hours
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        No sports registered in databases
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

        </main>
      </div>

      {/* ─── ADD SPORT MODAL ────────────────────────────────────────── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="modal-content"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Add New Sport offering</span>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none' }}
                >
                  <LuX size={18} />
                </button>
              </div>

              <form onSubmit={handleAddSportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="label-style" style={{ fontSize: '10px' }}>Sport / Court Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Futsal Arena A, Squash Court" 
                    value={newSport.name}
                    onChange={e => setNewSport(prev => ({ ...prev, name: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="label-style" style={{ fontSize: '10px' }}>Description</label>
                  <textarea 
                    placeholder="Describe court dimensions, lighting, flooring details..." 
                    value={newSport.description}
                    onChange={e => setNewSport(prev => ({ ...prev, description: e.target.value }))}
                    className="input-field"
                    style={{ height: '80px', padding: '10px 12px', resize: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="label-style" style={{ fontSize: '10px' }}>Image URL</label>
                  <input 
                    type="url" 
                    placeholder="https://images.unsplash.com/..." 
                    value={newSport.image}
                    onChange={e => setNewSport(prev => ({ ...prev, image: e.target.value }))}
                    className="input-field"
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button 
                    type="button" 
                    onClick={() => setIsAddModalOpen(false)} 
                    className="btn-secondary" 
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    style={{ flex: 1 }}
                    disabled={addLoading}
                  >
                    {addLoading ? <LuLoaderCircle size={16} className="spinner" /> : 'Save Sport'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── BLOCK TIME SLOT MODAL ──────────────────────────────────── */}
      <AnimatePresence>
        {isBlockModalOpen && (
          <div className="modal-overlay" onClick={() => setIsBlockModalOpen(false)}>
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="modal-content"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Block Facility Time Slots</span>
                <button 
                  onClick={() => setIsBlockModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none' }}
                >
                  <LuX size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px', backgroundColor: 'var(--warning-muted)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '12px', borderRadius: '8px', marginBottom: '16px', color: 'var(--warning)', fontSize: '12px' }}>
                <LuCircleAlert size={18} style={{ flexShrink: 0 }} />
                <span>Blocked time slots will display as unavailable on public booking grids to prevent users from booking during these hours.</span>
              </div>

              <form onSubmit={handleBlockSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="label-style" style={{ fontSize: '10px' }}>Select Sport / Facility</label>
                  <select 
                    value={blockData.sportId}
                    onChange={e => setBlockData(prev => ({ ...prev, sportId: e.target.value }))}
                    className="input-field"
                    style={{ cursor: 'pointer' }}
                  >
                    {sports.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="label-style" style={{ fontSize: '10px' }}>Target Date</label>
                  <input 
                    type="date" 
                    value={blockData.date}
                    onChange={e => setBlockData(prev => ({ ...prev, date: e.target.value }))}
                    className="input-field"
                    style={{ colorScheme: 'dark', cursor: 'pointer' }}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="label-style" style={{ fontSize: '10px' }}>Start Hour</label>
                    <select 
                      value={blockData.startTime}
                      onChange={e => setBlockData(prev => ({ ...prev, startTime: e.target.value }))}
                      className="input-field"
                      style={{ cursor: 'pointer' }}
                    >
                      {startHours.map(h => (
                        <option key={h} value={h}>{formatHourLabel(h)}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="label-style" style={{ fontSize: '10px' }}>End Hour</label>
                    <select 
                      value={blockData.endTime}
                      onChange={e => setBlockData(prev => ({ ...prev, endTime: e.target.value }))}
                      className="input-field"
                      style={{ cursor: 'pointer' }}
                    >
                      {endHours.map(h => (
                        <option key={h} value={h}>{formatHourLabel(h)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button 
                    type="button" 
                    onClick={() => setIsBlockModalOpen(false)} 
                    className="btn-secondary" 
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-destructive" 
                    style={{ flex: 1 }}
                    disabled={blockLoading}
                  >
                    {blockLoading ? <LuLoaderCircle size={16} className="spinner" /> : 'Confirm Block'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .admin-layout { flex-direction: column !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminSports;
