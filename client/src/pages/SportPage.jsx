import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import AuthContext from '../context/AuthContext';
import TimeSlotGrid from '../components/TimeSlotGrid';

/* ─── Helpers ───────────────────────────────────────────────── */
// Mirror of server calculatePrice — hours 9-17 = 1000/hr, 17-25 = 1500/hr
const calculatePrice = (startHour, endHour) => {
  let total = 0;
  for (let h = startHour; h < endHour; h++) {
    if (h >= 9 && h < 17) total += 1000;
    else if (h >= 17 && h < 25) total += 1500;
  }
  return total;
};

const formatHour = (h) => {
  const actual = h >= 24 ? h - 24 : h;
  const suffix = actual < 12 ? 'AM' : 'PM';
  const display = actual === 0 ? 12 : actual > 12 ? actual - 12 : actual;
  return display + ':00 ' + suffix;
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

/* ─── Sport config ──────────────────────────────────────────── */
const getSportCfg = (name = '') => {
  const lc = name.toLowerCase();
  if (lc.includes('cricket')) return { emoji: '🏏', gradient: 'linear-gradient(135deg,#00FF87,#00cc6a)', glow: 'rgba(0,255,135,0.2)', accent: '#00FF87' };
  if (lc.includes('football')) return { emoji: '⚽', gradient: 'linear-gradient(135deg,#00ccff,#0077ff)', glow: 'rgba(0,200,255,0.2)', accent: '#00ccff' };
  return { emoji: '🏟️', gradient: 'linear-gradient(135deg,#a855f7,#6366f1)', glow: 'rgba(168,85,247,0.2)', accent: '#a855f7' };
};

/* ─── Date Pill Selector ────────────────────────────────────── */
const DatePicker = ({ selectedDate, onSelect }) => {
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
      {dates.map((date) => {
        const ds = toDateString(date);
        const isSelected = ds === selectedDate;
        return (
          <motion.button
            key={ds}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelect(ds)}
            style={{
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              padding: '0.6rem 1rem',
              borderRadius: '999px',
              border: isSelected ? '1px solid #00FF87' : '1px solid rgba(255,255,255,0.1)',
              background: isSelected ? 'rgba(0,255,135,0.12)' : 'rgba(255,255,255,0.04)',
              color: isSelected ? '#00FF87' : '#9898B0',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: "'Inter', sans-serif",
              minWidth: '64px',
            }}
          >
            <span style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {getDayLabel(date)}
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: isSelected ? '#00FF87' : '#F0F0F5' }}>
              {date.getDate()}
            </span>
            <span style={{ fontSize: '0.62rem', opacity: 0.7 }}>
              {date.toLocaleDateString('en-US', { month: 'short' })}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};

/* ─── Booking Summary Panel ─────────────────────────────────── */
const BookingSummary = ({ sport, selectedDate, startHour, endHour, isAuthenticated, cfg, onProceed }) => {
  const hasSelection = startHour !== null && endHour !== null && endHour > startHour;
  const duration = hasSelection ? endHour - startHour : 0;
  const price = hasSelection ? calculatePrice(startHour, endHour) : 0;
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{
        background: '#13131A',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '1.25rem',
        padding: '1.5rem',
        position: 'sticky',
        top: '90px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F0F0F5', marginBottom: '0.2rem' }}>Booking Summary</h3>
        <p style={{ fontSize: '0.78rem', color: '#9898B0' }}>Select a time range to see pricing</p>
      </div>

      {/* Court info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '1.5rem' }}>{cfg.emoji}</span>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F0F0F5' }}>{sport?.name}</div>
          <div style={{ fontSize: '0.72rem', color: '#9898B0' }}>{selectedDate}</div>
        </div>
      </div>

      {/* Selection details */}
      <AnimatePresence mode="wait">
        {hasSelection ? (
          <motion.div
            key="has-selection"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {/* Time range */}
            <div style={{ background: 'rgba(0,255,135,0.07)', border: '1px solid rgba(0,255,135,0.18)', borderRadius: '0.75rem', padding: '0.85rem 1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#9898B0', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Time Range</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#00FF87' }}>
                {formatHour(startHour)} → {formatHour(endHour)}
              </div>
            </div>

            {/* Duration & price rows */}
            {[
              { label: 'Duration', value: duration + (duration === 1 ? ' hour' : ' hours') },
              { label: 'Rate (9AM–5PM)', value: 'Rs. 1,000/hr', small: true },
              { label: 'Rate (5PM–1AM)', value: 'Rs. 1,500/hr', small: true },
            ].map(({ label, value, small }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem' }}>
                <span style={{ fontSize: small ? '0.75rem' : '0.82rem', color: '#9898B0' }}>{label}</span>
                <span style={{ fontSize: small ? '0.75rem' : '0.82rem', color: '#F0F0F5', fontWeight: 600 }}>{value}</span>
              </div>
            ))}

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F0F0F5' }}>Total</span>
              <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#00FF87' }}>
                Rs. {price.toLocaleString()}
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="no-selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ textAlign: 'center', padding: '1.5rem 0', color: '#9898B0', fontSize: '0.82rem' }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🕐</div>
            Click a start slot then an end slot on the grid
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA button */}
      <div style={{ marginTop: '1.25rem' }}>
        {!isAuthenticated ? (
          <Link to="/login" style={{ textDecoration: 'none', display: 'block' }}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', padding: '0.85rem',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '0.75rem', color: '#F0F0F5',
                fontWeight: 700, fontSize: '0.9rem',
                cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              }}
            >
              🔒 Login to Book
            </motion.button>
          </Link>
        ) : (
          <motion.button
            whileHover={hasSelection ? { scale: 1.03, boxShadow: '0 6px 28px ' + cfg.glow } : {}}
            whileTap={hasSelection ? { scale: 0.97 } : {}}
            onClick={hasSelection ? onProceed : undefined}
            disabled={!hasSelection}
            style={{
              width: '100%', padding: '0.85rem',
              background: hasSelection ? cfg.gradient : 'rgba(255,255,255,0.06)',
              border: 'none', borderRadius: '0.75rem',
              color: hasSelection ? '#0A0A0F' : '#9898B0',
              fontWeight: 800, fontSize: '0.9rem',
              cursor: hasSelection ? 'pointer' : 'not-allowed',
              fontFamily: "'Inter', sans-serif",
              boxShadow: hasSelection ? '0 4px 20px ' + cfg.glow : 'none',
              transition: 'all 0.2s ease',
              opacity: hasSelection ? 1 : 0.5,
            }}
          >
            {hasSelection ? 'Proceed to Book →' : 'Select a Time Range'}
          </motion.button>
        )}
      </div>

      {/* Pricing note */}
      <p style={{ fontSize: '0.7rem', color: '#9898B0', textAlign: 'center', marginTop: '0.85rem', lineHeight: 1.5, opacity: 0.7 }}>
        Booking expires 10 min after creation if unpaid.
      </p>
    </motion.div>
  );
};

/* ─── Skeleton loader ───────────────────────────────────────── */
const SkeletonBlock = ({ h = '1rem', w = '100%', mb = '0.5rem', radius = '0.5rem' }) => (
  <div style={{
    height: h, width: w, marginBottom: mb,
    borderRadius: radius,
    background: 'linear-gradient(90deg,#13131A 25%,#1A1A24 50%,#13131A 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  }} />
);

/* ─── SportPage (Main) ──────────────────────────────────────── */
const SportPage = () => {
  const { sportId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, token } = useContext(AuthContext);

  const [sport, setSport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Date & slot selection state
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()));
  const [startHour, setStartHour] = useState(null);
  const [endHour, setEndHour] = useState(null);

  const cfg = getSportCfg(sport?.name);

  // Fetch sport info
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

  // Reset slots when date changes
  const handleDateSelect = useCallback((ds) => {
    setSelectedDate(ds);
    setStartHour(null);
    setEndHour(null);
  }, []);

  // Proceed to booking: navigate with state
  const handleProceed = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    navigate('/booking/new', {
      state: { sportId, sportName: sport?.name, date: selectedDate, startHour, endHour, price: calculatePrice(startHour, endHour) },
    });
  };

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Inter', sans-serif", paddingTop: '80px' }}>

      {/* Back button */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1.5rem 0' }}>
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -3 }}
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: 'none', border: 'none', color: '#9898B0',
            fontSize: '0.875rem', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            padding: '0', transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#00FF87'}
          onMouseLeave={e => e.currentTarget.style.color = '#9898B0'}
        >
          ← Back to Home
        </motion.button>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>

        {/* ── Loading State ─────────────────────────────────── */}
        {loading && (
          <div>
            <SkeletonBlock h="2.5rem" w="40%" mb="0.75rem" radius="0.75rem" />
            <SkeletonBlock h="1rem" w="60%" mb="2rem" />
            <SkeletonBlock h="3rem" mb="2rem" radius="1rem" />
            <SkeletonBlock h="300px" radius="1.25rem" />
          </div>
        )}

        {/* ── Error State ───────────────────────────────────── */}
        {!loading && error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              textAlign: 'center', padding: '4rem 2rem',
              background: '#13131A', borderRadius: '1.5rem',
              border: '1px solid rgba(255,80,80,0.2)',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ color: '#ff6060', fontWeight: 700, marginBottom: '0.5rem' }}>{error}</h2>
            <button onClick={() => navigate('/')} style={{
              marginTop: '1rem', background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)', color: '#F0F0F5',
              padding: '0.6rem 1.5rem', borderRadius: '999px', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
            }}>← Go Back</button>
          </motion.div>
        )}

        {/* ── Main Content ──────────────────────────────────── */}
        {!loading && !error && sport && (
          <>
            {/* Sport header */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{ marginBottom: '2rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '2rem' }}>{cfg.emoji}</span>
                <h1 style={{
                  fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
                  fontWeight: 900,
                  color: '#F0F0F5',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}>
                  {sport.name}
                </h1>
                {/* Accent line */}
                <div style={{ flex: 1, height: '2px', background: cfg.gradient, borderRadius: '1px', opacity: 0.4 }} />
              </div>
              {sport.description && (
                <p style={{ color: '#9898B0', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '700px' }}>
                  {sport.description}
                </p>
              )}
            </motion.div>

            {/* Two-column layout */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) 320px',
              gap: '1.5rem',
              alignItems: 'start',
            }}
              className="sport-page-grid"
            >
              {/* Left column — Date picker + TimeSlotGrid placeholder */}
              <div>
                {/* Date selector */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.1 }}
                  style={{
                    background: '#13131A',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '1.25rem',
                    padding: '1.25rem 1.5rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#9898B0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                    Select Date
                  </h2>
                  <DatePicker selectedDate={selectedDate} onSelect={handleDateSelect} />
                </motion.div>

                {/* TimeSlotGrid — placeholder for Prompt 3.3 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.18 }}
                  style={{
                    background: '#13131A',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '1.25rem',
                    padding: '1.25rem 1.5rem',
                    minHeight: '300px',
                  }}
                >
                  <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#9898B0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                    Available Slots — <span style={{ color: '#00FF87' }}>{selectedDate}</span>
                  </h2>

                  <TimeSlotGrid
                    sportId={sportId}
                    date={selectedDate}
                    onSelectionChange={(start, end) => {
                      setStartHour(start);
                      setEndHour(end);
                    }}
                  />
                </motion.div>
              </div>

              {/* Right column — Booking summary */}
              <BookingSummary
                sport={sport}
                selectedDate={selectedDate}
                startHour={startHour}
                endHour={endHour}
                isAuthenticated={isAuthenticated}
                cfg={cfg}
                onProceed={handleProceed}
              />
            </div>
          </>
        )}
      </div>

      {/* Responsive grid override */}
      <style>{`
        @media (max-width: 768px) {
          .sport-page-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
      `}</style>
    </div>
  );
};

export default SportPage;
