import { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import TimeSlotGrid, { formatHourLabel } from '../components/TimeSlotGrid';

// Price calculation helper: hours 9-17 = 1000/hr, 17-25 = 1500/hr
const calculatePrice = (startHour, endHour) => {
  let total = 0;
  for (let h = startHour; h < endHour; h++) {
    if (h >= 9 && h < 17) total += 1000;
    else if (h >= 17 && h < 25) total += 1500;
  }
  return total;
};

const toDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
};

const getDayLabel = (date) => {
  const today = new Date();
  const diff = Math.round((date - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

/* ─── Date Picker ─────────────────────────────────────────────── */
const DatePicker = ({ selectedDate, onSelect }) => {
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
      {dates.map((date) => {
        const ds = toDateString(date);
        const isSelected = ds === selectedDate;
        return (
          <button
            key={ds}
            onClick={() => onSelect(ds)}
            style={{
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: isSelected ? 'var(--accent-muted)' : 'transparent',
              color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'var(--font)',
              minWidth: '72px',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8 }}>
              {getDayLabel(date)}
            </span>
            <span style={{ fontSize: '16px', fontWeight: 600, color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>
              {date.getDate()}
            </span>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>
              {date.toLocaleDateString('en-US', { month: 'short' })}
            </span>
          </button>
        );
      })}
    </div>
  );
};

/* ─── Booking Summary Panel ───────────────────────────────────── */
const BookingSummary = ({ sport, selectedDate, startHour, endHour, isAuthenticated, onProceed }) => {
  const hasSelection = startHour !== null && endHour !== null && endHour > startHour;
  const duration = hasSelection ? endHour - startHour : 0;
  const price = hasSelection ? calculatePrice(startHour, endHour) : 0;

  // Format date display
  const displayDate = new Date(selectedDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const rowLabelStyle = {
    fontSize: '11px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#64748B'
  };

  const rowValueStyle = {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-primary)'
  };

  return (
    <div
      className="card"
      style={{
        position: 'sticky',
        top: '80px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          Booking Summary
        </h3>
        <hr className="card-divider" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Sport row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={rowLabelStyle}>Sport</span>
          <span style={rowValueStyle}>{sport?.name || '—'}</span>
        </div>
        <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

        {/* Date row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={rowLabelStyle}>Date</span>
          <span style={rowValueStyle}>{displayDate}</span>
        </div>
        <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

        {/* Time row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={rowLabelStyle}>Time</span>
          <span style={rowValueStyle}>
            {hasSelection ? `${formatHourLabel(startHour)} – ${formatHourLabel(endHour)}` : '—'}
          </span>
        </div>
        <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

        {/* Duration row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={rowLabelStyle}>Duration</span>
          <span style={rowValueStyle}>
            {hasSelection ? `${duration} hour${duration > 1 ? 's' : ''}` : '—'}
          </span>
        </div>
        <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

        {/* Total row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={rowLabelStyle}>Total</span>
          <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {hasSelection ? `Rs. ${price.toLocaleString()}` : '—'}
          </span>
        </div>
      </div>

      <hr className="card-divider" />

      {/* Warning/Hint state */}
      {!hasSelection && (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', margin: '8px 0' }}>
          Select a time slot above to continue
        </p>
      )}

      {/* Button CTA */}
      <div>
        {!isAuthenticated ? (
          <Link to="/login" style={{ textDecoration: 'none', display: 'block' }}>
            <button className="btn-secondary" style={{ width: '100%' }}>
              Login to Book
            </button>
          </Link>
        ) : (
          <button
            onClick={hasSelection ? onProceed : undefined}
            disabled={!hasSelection}
            className={hasSelection ? 'btn-primary' : 'btn-secondary'}
            style={{ width: '100%', cursor: hasSelection ? 'pointer' : 'not-allowed', opacity: hasSelection ? 1 : 0.4 }}
          >
            Proceed to Book
          </button>
        )}
      </div>

      <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', margin: '4px 0 0', lineHeight: '1.4' }}>
        Booking expires 10 min after creation if unpaid.
      </p>
    </div>
  );
};

/* ─── SportPage Main Component ────────────────────────────────── */
const SportPage = () => {
  const { sportId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);

  const [sport, setSport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()));
  const [startHour, setStartHour] = useState(null);
  const [endHour, setEndHour] = useState(null);

  // Fetch sport details
  useEffect(() => {
    if (!sportId) return;
    const fetchSport = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await axios.get('/api/sports/' + sportId);
        setSport(data);
      } catch (err) {
        setError(err.response?.status === 404 ? 'Sport not found.' : 'Failed to load sport details.');
      } finally {
        setLoading(false);
      }
    };
    fetchSport();
  }, [sportId]);

  const handleDateSelect = useCallback((ds) => {
    setSelectedDate(ds);
    setStartHour(null);
    setEndHour(null);
  }, []);

  const handleProceed = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    navigate('/booking/new', {
      state: { 
        sportId, 
        sportName: sport?.name, 
        date: selectedDate, 
        startHour, 
        endHour, 
        price: calculatePrice(startHour, endHour) 
      }
    });
  };

  // Page entrance animation variants
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
      {/* Back navigation */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 24px 0' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
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
          &larr; Back to Home
        </button>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px' }}>
        {/* Loading State */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ height: '36px', width: '200px', borderRadius: '8px', backgroundColor: 'var(--bg-elevated)', opacity: 0.3 }} />
            <div style={{ height: '60px', width: '100%', borderRadius: '8px', backgroundColor: 'var(--bg-elevated)', opacity: 0.3 }} />
            <div style={{ height: '300px', width: '100%', borderRadius: '12px', backgroundColor: 'var(--bg-elevated)', opacity: 0.3 }} />
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div style={{ 
            textAlign: 'center', 
            padding: '48px 24px', 
            backgroundColor: 'var(--bg-surface)', 
            border: '1px solid var(--border)', 
            borderRadius: '12px' 
          }}>
            <h2 style={{ color: 'var(--danger)', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>{error}</h2>
            <button onClick={() => navigate('/')} className="btn-secondary">Go Back</button>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && sport && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Header info */}
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                {sport.name}
              </h1>
              {sport.description && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, maxWidth: '700px', lineHeight: '1.6' }}>
                  {sport.description}
                </p>
              )}
            </div>

            {/* Split Grid Section */}
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 340px',
                gap: '48px',
                alignItems: 'start'
              }}
              className="split-layout"
            >
              {/* Left Column (Pills and Grid) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Date Pills Card */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <span className="label-style">Select Date</span>
                  <DatePicker selectedDate={selectedDate} onSelect={handleDateSelect} />
                </div>

                {/* Time Slots Card */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <span className="label-style">Available Slots &mdash; {selectedDate}</span>
                  <TimeSlotGrid
                    sportId={sportId}
                    date={selectedDate}
                    onSelectionChange={(start, end) => {
                      setStartHour(start);
                      setEndHour(end);
                    }}
                  />
                </div>
              </div>

              {/* Right Column (Booking summary) */}
              <div className="summary-col">
                <BookingSummary
                  sport={sport}
                  selectedDate={selectedDate}
                  startHour={startHour}
                  endHour={endHour}
                  isAuthenticated={isAuthenticated}
                  onProceed={handleProceed}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 860px) {
          .split-layout {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default SportPage;
