import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useSlotAvailability } from '../hooks/useSlotAvailability.js';

/* ─── Constants ─────────────────────────────────────────────── */
const MAX_HOURS = 4;
// Court open hours: 9 (9AM) to 24 (midnight/1AM = endTime 25)
const OPEN_HOURS = Array.from({ length: 16 }, (_, i) => i + 9); // [9..24]

/* ─── Slot visual config ─────────────────────────────────────── */
const SLOT_STYLES = {
  available: {
    bg:           '#1E1E2E',
    border:       'rgba(255,255,255,0.1)',
    color:        '#C0C0D0',
    labelColor:   '#9898B0',
    priceColor:   '#9898B0',
    cursor:       'pointer',
    hoverBg:      '#252535',
    hoverBorder:  'rgba(255,255,255,0.25)',
  },
  booked: {
    bg:           'rgba(0,255,135,0.12)',
    border:       'rgba(0,255,135,0.4)',
    color:        '#00FF87',
    labelColor:   '#00cc6a',
    priceColor:   '#00cc6a',
    cursor:       'not-allowed',
    hoverBg:      'rgba(0,255,135,0.12)',
    hoverBorder:  'rgba(0,255,135,0.4)',
  },
  pending: {
    bg:           'rgba(255,215,0,0.1)',
    border:       'rgba(255,215,0,0.4)',
    color:        '#FFD700',
    labelColor:   '#ccaa00',
    priceColor:   '#ccaa00',
    cursor:       'not-allowed',
    hoverBg:      'rgba(255,215,0,0.1)',
    hoverBorder:  'rgba(255,215,0,0.4)',
  },
  selected: {
    bg:           'rgba(99,102,241,0.2)',
    border:       '#6366f1',
    color:        '#a5b4fc',
    labelColor:   '#818cf8',
    priceColor:   '#818cf8',
    cursor:       'pointer',
    hoverBg:      'rgba(99,102,241,0.28)',
    hoverBorder:  '#818cf8',
  },
  closed: {
    bg:           'rgba(255,255,255,0.02)',
    border:       'rgba(255,255,255,0.05)',
    color:        '#3a3a4a',
    labelColor:   '#3a3a4a',
    priceColor:   '#3a3a4a',
    cursor:       'not-allowed',
    hoverBg:      'rgba(255,255,255,0.02)',
    hoverBorder:  'rgba(255,255,255,0.05)',
  },
};

/* ─── Slot status labels ─────────────────────────────────────── */
const STATUS_LABEL = {
  available: null,       // no label — show price
  booked:    'Booked',
  pending:   'Hold...',
  selected:  'Selected',
  closed:    'Closed',
};

/* ─── Single slot card ───────────────────────────────────────── */
const SlotCard = ({ slot, uiStatus, isRangeEdge, onClick }) => {
  const s = SLOT_STYLES[uiStatus] || SLOT_STYLES.available;
  const isInteractive = uiStatus === 'available' || uiStatus === 'selected';
  const statusLabel = STATUS_LABEL[uiStatus];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      whileHover={
        isInteractive
          ? { scale: 1.05, transition: { duration: 0.15 } }
          : { scale: 1 }
      }
      whileTap={isInteractive ? { scale: 0.95 } : {}}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : -1}
      onKeyDown={(e) => isInteractive && e.key === 'Enter' && onClick?.()}
      aria-label={slot.label + ' — ' + uiStatus}
      style={{
        background: s.bg,
        border: '1px solid ' + (isRangeEdge ? '#6366f1' : s.border),
        borderRadius: '0.65rem',
        padding: '0.55rem 0.4rem',
        textAlign: 'center',
        cursor: s.cursor,
        userSelect: 'none',
        outline: 'none',
        transition: 'background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
        boxShadow: uiStatus === 'selected'
          ? '0 0 0 1px #6366f1, 0 4px 12px rgba(99,102,241,0.3)'
          : isRangeEdge
          ? '0 0 0 2px #6366f1'
          : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Shimmer for pending */}
      {uiStatus === 'pending' && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.08) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.8s infinite',
          }}
        />
      )}

      {/* Time label */}
      <div style={{
        fontSize: '0.75rem',
        fontWeight: 700,
        color: s.color,
        lineHeight: 1.2,
        marginBottom: '3px',
      }}>
        {slot.label}
      </div>

      {/* Status or price */}
      <div style={{
        fontSize: '0.6rem',
        fontWeight: 600,
        color: s.labelColor,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}>
        {statusLabel
          ? statusLabel
          : slot.pricePerHour
          ? 'Rs.' + slot.pricePerHour.toLocaleString()
          : '—'}
      </div>
    </motion.div>
  );
};

/* ─── Skeleton loader ─────────────────────────────────────────── */
const SlotSkeleton = () => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
    gap: '0.5rem',
  }}>
    {Array.from({ length: 16 }).map((_, i) => (
      <div
        key={i}
        style={{
          height: '56px',
          borderRadius: '0.65rem',
          background: 'linear-gradient(90deg,#1a1a28 25%,#222234 50%,#1a1a28 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          animationDelay: i * 0.04 + 's',
        }}
      />
    ))}
  </div>
);

/* ─── Legend ──────────────────────────────────────────────────── */
const Legend = () => (
  <div style={{
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    marginBottom: '1rem',
  }}>
    {[
      { status: 'available', label: 'Available' },
      { status: 'selected',  label: 'Selected'  },
      { status: 'booked',    label: 'Booked'    },
      { status: 'pending',   label: 'On Hold'   },
      { status: 'closed',    label: 'Closed'    },
    ].map(({ status, label }) => {
      const s = SLOT_STYLES[status];
      return (
        <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{
            width: '11px', height: '11px', borderRadius: '3px',
            background: s.bg,
            border: '1px solid ' + s.border,
            flexShrink: 0,
          }} />
          <span style={{ fontSize: '0.7rem', color: '#9898B0', whiteSpace: 'nowrap' }}>{label}</span>
        </div>
      );
    })}
  </div>
);

/* ─── Selection summary bar ───────────────────────────────────── */
const SelectionBar = ({ startHour, endHour, slots, onClear }) => {
  if (startHour === null) return null;

  const startSlot = slots.find(s => s.hour === startHour);
  const endLabel  = endHour ? slots.find(s => s.hour === endHour - 1)?.label : null;
  const duration  = endHour ? endHour - startHour : 0;

  return (
    <AnimatePresence>
      <motion.div
        key="sel-bar"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.2 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '0.75rem',
          padding: '0.65rem 1rem',
          marginBottom: '1rem',
          fontSize: '0.82rem',
        }}
      >
        <span style={{ color: '#a5b4fc', fontWeight: 600 }}>
          {endHour
            ? '🎯 ' + startSlot?.label + ' → ' + endLabel + ' (' + duration + (duration === 1 ? ' hr' : ' hrs') + ')'
            : '📍 Start: ' + startSlot?.label + ' — now click an end slot'}
        </span>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClear}
          style={{
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.3)',
            color: '#a5b4fc',
            borderRadius: '999px',
            padding: '2px 10px',
            fontSize: '0.72rem',
            cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
          }}
        >
          Clear ✕
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
};

/* ─── TimeSlotGrid (main export) ──────────────────────────────── */
const TimeSlotGrid = ({ sportId, date, onSelectionChange }) => {
  const { slots, loading, error, refetch } = useSlotAvailability(sportId, date);
  const [startHour, setStartHour] = useState(null);
  const [endHour, setEndHour]     = useState(null);

  // Reset selection whenever date changes
  useEffect(() => {
    setStartHour(null);
    setEndHour(null);
  }, [date, sportId]);

  // Notify parent whenever selection changes
  useEffect(() => {
    onSelectionChange?.(startHour, endHour ?? null);
  }, [startHour, endHour, onSelectionChange]);

  // Determine the UI status for a given slot
  const getUiStatus = useCallback(
    (slot) => {
      // Server statuses: available, closed, booked, pending
      // We add: selected (client-only)
      if (slot.status === 'closed')   return 'closed';
      if (slot.status === 'booked')   return 'booked';
      if (slot.status === 'pending')  return 'pending';

      // Is this hour inside the selected range?
      if (
        startHour !== null &&
        endHour !== null &&
        slot.hour >= startHour &&
        slot.hour < endHour
      ) return 'selected';

      // Is this the pending start (no end chosen yet)?
      if (startHour !== null && endHour === null && slot.hour === startHour)
        return 'selected';

      return 'available';
    },
    [startHour, endHour]
  );

  const handleSlotClick = useCallback(
    (slot) => {
      const { hour, status } = slot;
      if (status === 'closed' || status === 'booked' || status === 'pending') return;

      /* ── Case 1: nothing selected yet → set start ── */
      if (startHour === null) {
        setStartHour(hour);
        setEndHour(null);
        return;
      }

      /* ── Case 2: clicking the start slot → deselect ── */
      if (hour === startHour && endHour === null) {
        setStartHour(null);
        setEndHour(null);
        return;
      }

      /* ── Case 3: end already set → restart selection ── */
      if (endHour !== null) {
        setStartHour(hour);
        setEndHour(null);
        return;
      }

      /* ── Case 4: choosing end slot ── */
      // Must click after the start
      if (hour <= startHour) {
        toast.error('End time must be after start time', { id: 'ts-order' });
        // Let them restart from the clicked slot instead
        setStartHour(hour);
        setEndHour(null);
        return;
      }

      const newEnd = hour + 1; // endHour is exclusive (hour after last selected)
      const duration = newEnd - startHour;

      // Max 4 hours check
      if (duration > MAX_HOURS) {
        toast.error('Maximum ' + MAX_HOURS + ' hours allowed', { id: 'ts-max' });
        return;
      }

      // Check for booked/pending overlap in the range
      const rangeSlots = slots.filter(
        (s) => s.hour >= startHour && s.hour < newEnd
      );
      const hasConflict = rangeSlots.some(
        (s) => s.status === 'booked' || s.status === 'pending'
      );
      if (hasConflict) {
        toast.error('Slot unavailable — a booked slot is in this range', { id: 'ts-conflict' });
        return;
      }

      setEndHour(newEnd);
    },
    [startHour, endHour, slots]
  );

  const handleClear = useCallback(() => {
    setStartHour(null);
    setEndHour(null);
  }, []);

  /* ── Render ─────────────────────────────────────── */
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          textAlign: 'center',
          padding: '2rem',
          background: 'rgba(255,80,80,0.06)',
          border: '1px solid rgba(255,80,80,0.2)',
          borderRadius: '1rem',
        }}
      >
        <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>⚠️</div>
        <p style={{ color: '#ff6060', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{error}</p>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={refetch}
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#F0F0F5',
            padding: '0.45rem 1.25rem',
            borderRadius: '999px',
            cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.8rem',
          }}
        >
          Retry
        </motion.button>
      </motion.div>
    );
  }

  // Filter to only show open hours (9→24) — closed hours handled via status
  const visibleSlots = loading
    ? []
    : slots.filter((s) => OPEN_HOURS.includes(s.hour));

  return (
    <div>
      <Legend />

      {/* Selection status bar */}
      <SelectionBar
        startHour={startHour}
        endHour={endHour}
        slots={slots}
        onClear={handleClear}
      />

      {/* Instructions */}
      {startHour === null && (
        <p style={{
          fontSize: '0.75rem',
          color: '#9898B0',
          marginBottom: '0.85rem',
          opacity: 0.8,
        }}>
          💡 Click a slot to set <strong style={{ color: '#a5b4fc' }}>start</strong>, then click another to set <strong style={{ color: '#a5b4fc' }}>end</strong> (max {MAX_HOURS} hrs).
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <SlotSkeleton />
      ) : (
        <motion.div
          layout
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
            gap: '0.5rem',
          }}
        >
          <AnimatePresence>
            {visibleSlots.map((slot, i) => {
              const uiStatus = getUiStatus(slot);
              const isRangeEdge =
                (slot.hour === startHour || slot.hour === (endHour ?? -1) - 1) &&
                uiStatus === 'selected';

              return (
                <SlotCard
                  key={slot.hour}
                  slot={slot}
                  uiStatus={uiStatus}
                  isRangeEdge={isRangeEdge}
                  onClick={() => handleSlotClick(slot)}
                />
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Live indicator */}
      {!loading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '1rem',
          fontSize: '0.7rem',
          color: '#9898B0',
          opacity: 0.7,
        }}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: '#00FF87',
            animation: 'pulse-glow 2s ease-in-out infinite',
            display: 'inline-block',
            flexShrink: 0,
          }} />
          Live availability — updates in real-time
        </div>
      )}
    </div>
  );
};

export default TimeSlotGrid;
