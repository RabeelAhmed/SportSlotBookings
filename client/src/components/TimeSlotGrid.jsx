import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useSlotAvailability } from '../hooks/useSlotAvailability.js';

const MAX_HOURS = 4;
const OPEN_HOURS = Array.from({ length: 16 }, (_, i) => i + 9); // [9..24] (9 AM to 1 AM)

// Helper to format hour integer to 12-hour format
const formatHourLabel = (h) => {
  const actual = h >= 24 ? h - 24 : h;
  const suffix = actual < 12 ? 'AM' : 'PM';
  const display = actual === 0 ? 12 : actual > 12 ? actual - 12 : actual;
  return display + ':00 ' + suffix;
};

// Slot cell component
const SlotCard = ({ slot, uiStatus, isRangeEdge, onClick }) => {
  const isInteractive = uiStatus === 'available' || uiStatus === 'selected';

  // State configurations
  const stateConfigs = {
    available: {
      bg: 'var(--bg-elevated)',
      text: 'var(--text-primary)',
      border: 'var(--border)',
      label: 'Available',
      labelColor: 'var(--text-muted)',
      cursor: 'pointer'
    },
    selected: {
      bg: 'var(--accent-muted)',
      text: 'var(--accent)',
      border: 'var(--accent)',
      label: 'Selected',
      labelColor: 'var(--accent)',
      cursor: 'pointer'
    },
    booked: {
      bg: 'var(--success-muted)',
      text: 'var(--success)',
      border: 'transparent',
      label: 'Booked',
      labelColor: 'var(--success)',
      cursor: 'default'
    },
    pending: {
      bg: 'var(--warning-muted)',
      text: 'var(--warning)',
      border: 'transparent',
      label: 'Hold',
      labelColor: 'var(--warning)',
      cursor: 'default'
    },
    blocked: {
      bg: 'var(--bg-surface)',
      text: 'var(--text-muted)',
      border: 'transparent',
      label: 'Blocked',
      labelColor: 'var(--text-muted)',
      cursor: 'default'
    },
    closed: {
      bg: 'var(--bg-base)',
      text: 'var(--text-muted)',
      border: 'var(--border-subtle)',
      label: 'Closed',
      labelColor: 'var(--text-muted)',
      cursor: 'default'
    }
  };

  const config = stateConfigs[uiStatus] || stateConfigs.available;

  return (
    <motion.div
      whileHover={uiStatus === 'available' ? { scale: 1.02 } : { scale: 1 }}
      transition={{ duration: 0.15 }}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : -1}
      onKeyDown={(e) => isInteractive && e.key === 'Enter' && onClick?.()}
      aria-label={`${slot.label} — ${config.label}`}
      style={{
        height: '64px',
        borderRadius: '8px',
        backgroundColor: config.bg,
        border: `1px solid ${isRangeEdge ? 'var(--accent)' : config.border}`,
        cursor: config.cursor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        outline: 'none',
        transition: 'border-color 0.15s ease, background-color 0.15s ease'
      }}
    >
      {/* Time Label */}
      <span style={{ fontSize: '13px', fontWeight: 500, color: config.text }}>
        {slot.label}
      </span>
      {/* Status Label */}
      <span style={{ fontSize: '11px', color: config.labelColor, marginTop: '2px', fontWeight: 400 }}>
        {config.label}
      </span>
    </motion.div>
  );
};

// Clean Legend component
const Legend = () => (
  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
    {[
      { status: 'available', label: 'Available', bg: 'var(--bg-elevated)', border: 'var(--border)' },
      { status: 'selected', label: 'Selected', bg: 'var(--accent-muted)', border: 'var(--accent)' },
      { status: 'booked', label: 'Booked', bg: 'var(--success-muted)', border: 'transparent' },
      { status: 'pending', label: 'Hold', bg: 'var(--warning-muted)', border: 'transparent' },
      { status: 'closed', label: 'Closed', bg: 'var(--bg-base)', border: 'var(--border-subtle)' }
    ].map((item) => (
      <div key={item.status} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '3px',
          backgroundColor: item.bg,
          border: item.border !== 'transparent' ? `1px solid ${item.border}` : 'none'
        }} />
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {item.label}
        </span>
      </div>
    ))}
  </div>
);

// Selection status display bar
const SelectionBar = ({ startHour, endHour, slots, onClear }) => {
  if (startHour === null) return null;

  const startSlot = slots.find(s => s.hour === startHour);
  const endLabel = endHour ? slots.find(s => s.hour === endHour - 1)?.label : null;
  const duration = endHour ? endHour - startHour : 0;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'var(--accent-muted)',
      border: '1px solid var(--accent)',
      borderRadius: '8px',
      padding: '12px 16px',
      marginBottom: '16px',
      fontSize: '13px'
    }}>
      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
        {endHour
          ? `${startSlot?.label} to ${endLabel} (${duration} ${duration === 1 ? 'hour' : 'hours'})`
          : `Start time set at ${startSlot?.label} — select end slot`}
      </span>
      <button
        onClick={onClear}
        className="btn-secondary"
        style={{ height: '28px', padding: '0 12px', fontSize: '12px' }}
      >
        Clear
      </button>
    </div>
  );
};

// Main Grid component
const TimeSlotGrid = ({ sportId, date, onSelectionChange }) => {
  const { slots, loading, error, refetch } = useSlotAvailability(sportId, date);
  const [startHour, setStartHour] = useState(null);
  const [endHour, setEndHour] = useState(null);

  // Reset selection on date/sport changes
  useEffect(() => {
    setStartHour(null);
    setEndHour(null);
  }, [date, sportId]);

  // Propagate selection to parent page
  useEffect(() => {
    onSelectionChange?.(startHour, endHour ?? null);
  }, [startHour, endHour, onSelectionChange]);

  const getUiStatus = useCallback((slot) => {
    // Map backend statuses
    if (slot.status === 'closed') return 'closed';
    if (slot.status === 'booked') return 'booked';
    if (slot.status === 'pending') return 'pending';
    if (slot.status === 'blocked') return 'blocked';

    // Selection range logic
    if (startHour !== null && endHour !== null && slot.hour >= startHour && slot.hour < endHour) {
      return 'selected';
    }
    if (startHour !== null && endHour === null && slot.hour === startHour) {
      return 'selected';
    }

    return 'available';
  }, [startHour, endHour]);

  const handleSlotClick = useCallback((slot) => {
    const { hour, status } = slot;
    if (status === 'closed' || status === 'booked' || status === 'pending' || status === 'blocked') return;

    // First click: select start
    if (startHour === null) {
      setStartHour(hour);
      setEndHour(null);
      return;
    }

    // Clicking start again: reset
    if (hour === startHour && endHour === null) {
      setStartHour(null);
      setEndHour(null);
      return;
    }

    // Already completed selection: start new selection
    if (endHour !== null) {
      setStartHour(hour);
      setEndHour(null);
      return;
    }

    // Selecting end: must be after start
    if (hour <= startHour) {
      toast.error('End time must be after start time');
      setStartHour(hour);
      setEndHour(null);
      return;
    }

    const newEnd = hour + 1;
    const duration = newEnd - startHour;

    if (duration > MAX_HOURS) {
      toast.error(`Maximum booking duration is ${MAX_HOURS} hours`);
      return;
    }

    // Check for overlap conflicts in range
    const rangeSlots = slots.filter(s => s.hour >= startHour && s.hour < newEnd);
    const hasConflict = rangeSlots.some(s => s.status === 'booked' || s.status === 'pending' || s.status === 'blocked' || s.status === 'closed');
    if (hasConflict) {
      toast.error('Selected range contains unavailable slots');
      return;
    }

    setEndHour(newEnd);
  }, [startHour, endHour, slots]);

  const handleClear = useCallback(() => {
    setStartHour(null);
    setEndHour(null);
  }, []);

  if (error) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '24px',
        backgroundColor: 'var(--danger-muted)',
        border: '1px solid var(--danger)',
        borderRadius: '8px',
        color: 'var(--danger)'
      }}>
        <p style={{ fontSize: '14px', marginBottom: '12px' }}>{error}</p>
        <button className="btn-secondary" onClick={refetch}>Retry</button>
      </div>
    );
  }

  // Skeleton loader layout
  if (loading) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px'
      }} className="mobile-grid-2">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: '64px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-elevated)',
              opacity: 0.3,
              animation: 'pulse 1.5s infinite ease-in-out'
            }}
          />
        ))}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }
          @media (max-width: 600px) {
            .mobile-grid-2 {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
        `}</style>
      </div>
    );
  }

  const visibleSlots = slots.filter(s => OPEN_HOURS.includes(s.hour));

  return (
    <div>
      <Legend />

      <SelectionBar
        startHour={startHour}
        endHour={endHour}
        slots={slots}
        onClear={handleClear}
      />

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px'
      }} className="mobile-grid-2">
        {visibleSlots.map((slot) => {
          const uiStatus = getUiStatus(slot);
          const isRangeEdge = (slot.hour === startHour || slot.hour === (endHour ?? -1) - 1) && uiStatus === 'selected';

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
      </div>

      <style>{`
        @media (max-width: 600px) {
          .mobile-grid-2 {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TimeSlotGrid;
export { formatHourLabel };
