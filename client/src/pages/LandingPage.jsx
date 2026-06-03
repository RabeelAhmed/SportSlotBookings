import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import AuthContext from '../context/AuthContext';
import SportCard from '../components/SportCard';

/* ─── Animated grid background ─────────────────────────────── */
const GridBackground = () => (
  <div aria-hidden="true" style={{
    position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
  }}>
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: `
        linear-gradient(rgba(0,255,135,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,255,135,0.04) 1px, transparent 1px)
      `,
      backgroundSize: '60px 60px',
      animation: 'grid-move 8s linear infinite',
    }} />
    <div style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,255,135,0.12) 0%, transparent 70%)',
    }} />
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(to bottom, transparent 60%, #0A0A0F 100%)',
    }} />
  </div>
);

/* ─── Navbar ────────────────────────────────────────────────── */
const Navbar = ({ scrolled }) => {
  const { user, isAuthenticated, isAdmin, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/'); };

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(10,10,15,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
        transition: 'all 0.35s ease',
        padding: '0 1.5rem',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <motion.span whileHover={{ rotate: 15 }} style={{ fontSize: '1.6rem' }} aria-hidden="true">🏟️</motion.span>
          <span style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#F0F0F5' }}>
            Sport<span style={{ color: '#00FF87' }}>Slot</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }} className="desktop-nav">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/my-bookings">My Bookings</NavLink>
          {isAdmin && <NavLink to="/admin">Admin</NavLink>}
        </div>

        {/* Auth buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isAuthenticated ? (
            <>
              <span style={{ fontSize: '0.875rem', color: '#9898B0', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                👤 {user?.name || user?.email}
              </span>
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleLogout} className="btn-outline" style={{ fontSize: '0.8rem', padding: '0.45rem 1.1rem' }}>
                Logout
              </motion.button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-outline" style={{ fontSize: '0.85rem', padding: '0.45rem 1.1rem', textDecoration: 'none' }}>
                Login
              </Link>
              <Link to="/register">
                <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="btn-accent" style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', borderRadius: '9999px' }}>
                  Register
                </motion.span>
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

const NavLink = ({ to, children }) => (
  <Link to={to} style={{ textDecoration: 'none', color: '#9898B0', fontWeight: 500, fontSize: '0.9rem', transition: 'color 0.2s' }}
    onMouseEnter={e => e.target.style.color = '#00FF87'}
    onMouseLeave={e => e.target.style.color = '#9898B0'}>
    {children}
  </Link>
);

/* ─── Hero Section ──────────────────────────────────────────── */
const HeroSection = () => {
  const handleScroll = () => {
    document.getElementById('sports')?.scrollIntoView({ behavior: 'smooth' });
  };

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.18 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } },
  };

  return (
    <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', overflow: 'hidden', padding: '6rem 1.5rem 4rem' }}>
      <GridBackground />

      <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ position: 'relative', zIndex: 1, maxWidth: '860px', margin: '0 auto' }}>
        {/* Badge */}
        <motion.div variants={itemVariants}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.25)', color: '#00FF87', fontSize: '0.8rem', fontWeight: 600, padding: '0.4rem 1rem', borderRadius: '999px', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00FF87', animation: 'pulse-glow 2s ease-in-out infinite', display: 'inline-block' }} />
            Real-time slot booking • Cricket & Football
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1 variants={itemVariants} style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '1.25rem', color: '#F0F0F5' }}>
          Book Your Court.{' '}
          <span style={{ background: 'linear-gradient(135deg, #00FF87 0%, #00ccff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Play Your Game.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p variants={itemVariants} style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', color: '#9898B0', maxWidth: '600px', margin: '0 auto 2.5rem', lineHeight: 1.65 }}>
          Real-time slot booking for Cricket &amp; Football courts in your city. Choose your slot, pay instantly, and get your QR code.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={itemVariants} style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <motion.button
            id="hero-cta-book"
            whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(0,255,135,0.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={handleScroll}
            className="btn-accent"
            style={{ fontSize: '1rem', padding: '0.85rem 2.2rem' }}
          >
            ⚡ Book a Slot Now
          </motion.button>
          <Link to="/my-bookings" style={{ textDecoration: 'none' }}>
            <motion.span whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', padding: '0.85rem 2rem' }}>
              My Bookings →
            </motion.span>
          </Link>
        </motion.div>

        {/* Floating stats */}
        <motion.div variants={itemVariants} style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '4rem', flexWrap: 'wrap' }}>
          {[['🏏', 'Cricket', 'Court Available'], ['⚽', 'Football', 'Ground Ready'], ['📱', 'Instant', 'QR Confirmation']].map(([icon, title, sub]) => (
            <div key={title} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{icon}</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F0F0F5' }}>{title}</div>
              <div style={{ fontSize: '0.75rem', color: '#9898B0' }}>{sub}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', color: '#9898B0', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', zIndex: 1 }}
        onClick={handleScroll}
      >
        <span>Scroll</span>
        <span style={{ fontSize: '1.1rem' }}>↓</span>
      </motion.div>
    </section>
  );
};

/* ─── How It Works ──────────────────────────────────────────── */
const steps = [
  { icon: '🏟️', step: '01', title: 'Choose Sport', desc: 'Browse Cricket or Football courts available near you with live availability.' },
  { icon: '📅', step: '02', title: 'Pick Your Slot', desc: 'Select your preferred date and time slot. See pricing for peak and off-peak hours.' },
  { icon: '📲', step: '03', title: 'Pay & Get QR', desc: 'Complete payment and receive your unique QR code for court access instantly.' },
];

const HowItWorksSection = () => (
  <section style={{ padding: '6rem 1.5rem', position: 'relative' }}>
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', marginBottom: '4rem' }}
      >
        <span style={{ color: '#00FF87', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Simple Process</span>
        <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginTop: '0.75rem', letterSpacing: '-0.02em', color: '#F0F0F5' }}>
          How It Works
        </h2>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', position: 'relative' }}>
        {/* Connector line */}
        <div aria-hidden="true" style={{ position: 'absolute', top: '4rem', left: '16%', right: '16%', height: '2px', background: 'linear-gradient(90deg, transparent, rgba(0,255,135,0.3), transparent)', display: 'none' }} className="connector-line" />

        {steps.map((s, i) => (
          <motion.div
            key={s.step}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              background: '#13131A',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '1.25rem',
              padding: '2rem',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(0,255,135,0.5), transparent)' }} />
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#00FF87', letterSpacing: '0.1em', marginBottom: '1rem', opacity: 0.7 }}>STEP {s.step}</div>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{s.icon}</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F0F0F5', marginBottom: '0.6rem' }}>{s.title}</h3>
            <p style={{ fontSize: '0.875rem', color: '#9898B0', lineHeight: 1.65 }}>{s.desc}</p>

            {i < steps.length - 1 && (
              <div aria-hidden="true" style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', color: '#00FF87', opacity: 0.4, fontSize: '1.2rem', fontWeight: 700 }}>→</div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── Sports Section ────────────────────────────────────────── */
const SportsSection = () => {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const { data } = await axios.get('/api/sports');
        // Normalize: server returns plain array, but guard against unexpected shapes
        if (Array.isArray(data)) {
          setSports(data);
        } else if (data && Array.isArray(data.sports)) {
          setSports(data.sports);
        } else if (data && Array.isArray(data.data)) {
          setSports(data.data);
        } else {
          // Got a non-array response — treat as empty (no sports seeded yet)
          setSports([]);
        }
      } catch (err) {
        const isNetworkErr = !err.response;
        setError(
          isNetworkErr
            ? 'Cannot reach the server. Make sure the backend is running.'
            : 'Could not load sports. Please try again later.'
        );
        setSports([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSports();
  }, []);

  const skeletonCards = Array.from({ length: 2 });

  return (
    <section id="sports" style={{ padding: '6rem 1.5rem', background: 'linear-gradient(to bottom, #0A0A0F, #0d0d14, #0A0A0F)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '3.5rem' }}
        >
          <span style={{ color: '#00FF87', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Available Now</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginTop: '0.75rem', letterSpacing: '-0.02em', color: '#F0F0F5' }}>
            Choose Your Sport
          </h2>
          <p style={{ color: '#9898B0', marginTop: '0.75rem', fontSize: '1rem', maxWidth: '500px', margin: '0.75rem auto 0' }}>
            Select a sport below and start browsing available slots in real-time.
          </p>
        </motion.div>

        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {skeletonCards.map((_, i) => (
              <div key={i} style={{
                background: '#13131A', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.07)',
                height: '280px',
                backgroundImage: 'linear-gradient(90deg, #13131A 25%, #1A1A24 50%, #13131A 75%)',
                backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
              }} />
            ))}
          </div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '3rem', background: '#13131A', borderRadius: '1.25rem', border: '1px solid rgba(255,80,80,0.2)' }}>
            <span style={{ fontSize: '2rem' }}>⚠️</span>
            <p style={{ color: '#ff6060', marginTop: '1rem', fontWeight: 600 }}>{error}</p>
          </motion.div>
        )}

        {!loading && !error && sports.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '3rem', background: '#13131A', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ fontSize: '3rem' }}>🏟️</span>
            <p style={{ color: '#9898B0', marginTop: '1rem' }}>No sports available at the moment. Check back soon!</p>
          </motion.div>
        )}

        {!loading && !error && sports.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {sports.map((sport, i) => (
              <SportCard key={sport._id} sport={sport} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

/* ─── Footer ────────────────────────────────────────────────── */
const Footer = () => (
  <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '3rem 1.5rem', background: '#0A0A0F' }}>
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.4rem' }}>🏟️</span>
        <span style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#F0F0F5' }}>
          Sport<span style={{ color: '#00FF87' }}>Slot</span>
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#9898B0', fontSize: '0.875rem' }}>
        <span>📍 Sports Complex, Main Road, Your City</span>
        <span>📞 +92-300-0000000</span>
      </div>

      <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.06)' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'center' }}>
        <p style={{ color: '#9898B0', fontSize: '0.8rem' }}>
          &copy; {new Date().getFullYear()} SportSlot. All rights reserved.
        </p>
        <p style={{ color: '#9898B0', fontSize: '0.75rem', opacity: 0.6 }}>
          Powered by <span style={{ color: '#00FF87', fontWeight: 600 }}>SportSlot</span>
        </p>
      </div>
    </div>
  </footer>
);

/* ─── Main LandingPage ──────────────────────────────────────── */
const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Inter', sans-serif" }}>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#13131A', color: '#F0F0F5', border: '1px solid rgba(255,255,255,0.1)' },
      }} />
      <Navbar scrolled={scrolled} />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <SportsSection />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
