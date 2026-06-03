import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

/* ─── Sport visual config ───────────────────────────────────── */
const SPORT_CONFIG = {
  cricket: {
    emoji: '🏏',
    gradient: 'linear-gradient(135deg, #00FF87 0%, #00cc6a 100%)',
    glowColor: 'rgba(0,255,135,0.22)',
    tagColor: '#00FF87',
    bgGlow: 'radial-gradient(ellipse at top left, rgba(0,255,135,0.09) 0%, transparent 65%)',
    label: 'Cricket',
  },
  football: {
    emoji: '⚽',
    gradient: 'linear-gradient(135deg, #00ccff 0%, #0077ff 100%)',
    glowColor: 'rgba(0,200,255,0.22)',
    tagColor: '#00ccff',
    bgGlow: 'radial-gradient(ellipse at top left, rgba(0,200,255,0.09) 0%, transparent 65%)',
    label: 'Football',
  },
  default: {
    emoji: '🏟️',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
    glowColor: 'rgba(168,85,247,0.22)',
    tagColor: '#a855f7',
    bgGlow: 'radial-gradient(ellipse at top left, rgba(168,85,247,0.09) 0%, transparent 65%)',
    label: 'Sport',
  },
};

const getSportConfig = (name = '') => {
  const lc = name.toLowerCase();
  if (lc.includes('cricket'))  return SPORT_CONFIG.cricket;
  if (lc.includes('football')) return SPORT_CONFIG.football;
  return SPORT_CONFIG.default;
};

/* ─── Court open/closed badge ───────────────────────────────── */
// Court hours: 9 AM (9) → 1 AM next day (25 = hour 1 of next day)
const CourtStatusBadge = () => {
  const now = new Date();
  let hour = now.getHours();
  // Treat hours 0–1 as 24–25 for overnight comparison
  const h = hour < 2 ? hour + 24 : hour;
  const isOpen = h >= 9 && h < 25; // 9 AM to 1 AM

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      fontSize: '0.7rem',
      fontWeight: 700,
      padding: '3px 9px',
      borderRadius: '999px',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      background: isOpen ? 'rgba(0,255,135,0.12)' : 'rgba(255,80,80,0.12)',
      border: '1px solid ' + (isOpen ? 'rgba(0,255,135,0.3)' : 'rgba(255,80,80,0.3)'),
      color: isOpen ? '#00FF87' : '#ff6060',
    }}>
      <span style={{
        width: '6px', height: '6px', borderRadius: '50%',
        background: isOpen ? '#00FF87' : '#ff6060',
        animation: isOpen ? 'pulse-glow 2s ease-in-out infinite' : 'none',
        display: 'inline-block',
        flexShrink: 0,
      }} />
      {isOpen ? 'Court Open' : 'Court Closed'}
    </span>
  );
};

/* ─── SportCard ─────────────────────────────────────────────── */
const SportCard = ({ sport, index = 0 }) => {
  const navigate = useNavigate();
  const cfg = getSportConfig(sport?.name);

  const handleBook = (e) => {
    e?.stopPropagation();
    if (sport?._id) navigate('/sport/' + sport._id);
  };

  return (
    <motion.article
      id={'sport-card-' + (sport?._id || index)}
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.55, delay: index * 0.13, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -7, transition: { duration: 0.22 } }}
      onClick={handleBook}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleBook()}
      role="button"
      aria-label={'Book ' + (sport?.name || 'court')}
      style={{
        background: '#13131A',
        borderRadius: '1.25rem',
        border: '1px solid rgba(255,255,255,0.07)',
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        outline: 'none',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
      // CSS hover done via whileHover + inline style transitions
    >
      {/* Radial bg glow */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: cfg.bgGlow, pointerEvents: 'none' }} />

      {/* Top gradient bar */}
      <div aria-hidden="true" style={{ height: '3px', background: cfg.gradient, position: 'relative', zIndex: 1 }} />

      {/* Sport image */}
      {sport?.image ? (
        <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
          <img
            src={sport.image}
            alt={sport.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            onError={e => { e.target.style.display = 'none'; e.target.parentElement.style.display = 'none'; }}
          />
          {/* Gradient overlay on image */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top, #13131A, transparent)' }} />
        </div>
      ) : (
        /* Emoji placeholder when no image */
        <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <motion.span
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ fontSize: '4rem' }}
            aria-hidden="true"
          >
            {cfg.emoji}
          </motion.span>
        </div>
      )}

      {/* Card body */}
      <div style={{ padding: '1.25rem 1.5rem 1.5rem', position: 'relative', zIndex: 1 }}>

        {/* Badges row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          {/* Sport type badge */}
          <span style={{
            background: cfg.glowColor,
            color: cfg.tagColor,
            border: '1px solid ' + cfg.tagColor + '33',
            fontSize: '0.68rem',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '999px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            {cfg.label}
          </span>
          {/* Live court status */}
          <CourtStatusBadge />
        </div>

        {/* Name */}
        <h3 style={{
          fontSize: '1.2rem',
          fontWeight: 800,
          color: '#F0F0F5',
          marginBottom: '0.4rem',
          lineHeight: 1.3,
          letterSpacing: '-0.01em',
        }}>
          {sport?.name || 'Sports Court'}
        </h3>

        {/* Description */}
        {sport?.description && (
          <p style={{
            fontSize: '0.855rem',
            color: '#9898B0',
            lineHeight: 1.6,
            marginBottom: '1.1rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {sport.description}
          </p>
        )}

        {/* Pricing info */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginBottom: '1.25rem',
          paddingTop: '0.85rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{ fontSize: '0.75rem', color: '#9898B0', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ☀️ <span>9AM–5PM: <strong style={{ color: '#F0F0F5' }}>Rs. 1,000/hr</strong></span>
          </span>
          <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.75rem' }}>|</span>
          <span style={{ fontSize: '0.75rem', color: '#9898B0', display: 'flex', alignItems: 'center', gap: '4px' }}>
            🌙 <span>5PM–1AM: <strong style={{ color: '#F0F0F5' }}>Rs. 1,500/hr</strong></span>
          </span>
        </div>

        {/* Book Now CTA */}
        <motion.button
          whileHover={{ scale: 1.03, boxShadow: '0 6px 28px ' + cfg.glowColor }}
          whileTap={{ scale: 0.96 }}
          onClick={handleBook}
          style={{
            width: '100%',
            padding: '0.78rem',
            background: cfg.gradient,
            border: 'none',
            borderRadius: '0.75rem',
            color: '#0A0A0F',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
            boxShadow: '0 4px 18px ' + cfg.glowColor,
            letterSpacing: '0.02em',
          }}
        >
          Book Now →
        </motion.button>
      </div>

      {/* Hover glow border via CSS injection */}
      <style>{`
        #sport-card-${sport?._id || index}:hover {
          box-shadow: 0 12px 40px ${cfg.glowColor}, 0 4px 20px rgba(0,0,0,0.5) !important;
          border-color: ${cfg.tagColor}55 !important;
        }
        #sport-card-${sport?._id || index}:focus-visible {
          outline: 2px solid ${cfg.tagColor};
          outline-offset: 3px;
        }
      `}</style>
    </motion.article>
  );
};

export default SportCard;
