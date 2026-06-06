import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import SportCard from '../components/SportCard';

// Page entrance motion configuration
const pageVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.25, ease: 'easeOut' } 
  }
};

const listContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06
    }
  }
};

const LandingPage = () => {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const { data } = await axios.get('/api/sports');
        if (Array.isArray(data)) {
          setSports(data);
        } else if (data && Array.isArray(data.sports)) {
          setSports(data.sports);
        } else if (data && Array.isArray(data.data)) {
          setSports(data.data);
        } else {
          setSports([]);
        }
      } catch (err) {
        setError(!err.response ? 'Cannot reach server' : 'Could not load sports');
      } finally {
        setLoading(false);
      }
    };
    fetchSports();
  }, []);

  const handleScrollToSports = () => {
    document.getElementById('sports-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      style={{ 
        width: '100%', 
        backgroundColor: 'var(--bg-base)', 
        minHeight: '100vh',
        paddingTop: '56px' // Account for fixed 56px navbar
      }}
    >
      {/* Hero Section */}
      <section style={{
        position: 'relative',
        height: 'calc(100vh - 56px)',
        minHeight: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        overflow: 'hidden'
      }}>
        {/* Subtle radial indigo gradient */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.12) 0%, transparent 65%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: 'clamp(32px, 8vw, 56px)', 
            fontWeight: 600, 
            lineHeight: 1.15, 
            letterSpacing: '-0.02em', 
            color: 'var(--text-primary)',
            marginBottom: '16px'
          }}>
            Book Your Court. Play Your Game.
          </h1>
          <p style={{
            fontSize: '15px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '480px',
            margin: '0 auto 32px'
          }}>
            Real-time slot booking for Cricket and Football courts in your city. Choose your slot, pay instantly, and get your QR code.
          </p>
          <div>
            <button 
              id="hero-cta-book"
              onClick={handleScrollToSports}
              className="btn-primary"
              style={{ padding: '0 28px', height: '44px', fontSize: '15px' }}
            >
              Book a Slot Now
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{
        padding: '96px 24px',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-base)'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span className="label-style">Simple Process</span>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>
              How It Works
            </h2>
          </div>

          {/* Flat Numbered Step List (No Cards, No Dividers) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '48px'
          }}>
            {[
              { num: '01', title: 'Choose Sport', desc: 'Browse Cricket or Football courts available near you with live availability.' },
              { num: '02', title: 'Pick Your Slot', desc: 'Select your preferred date and time slot. See pricing for peak and off-peak hours.' },
              { num: '03', title: 'Pay & Get QR', desc: 'Complete payment and receive your unique QR code for court access instantly.' }
            ].map((step) => (
              <div key={step.num} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ 
                  fontSize: '44px', 
                  fontWeight: 700, 
                  color: 'var(--accent)', 
                  lineHeight: '1',
                  letterSpacing: '-0.02em'
                }}>
                  {step.num}
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {step.title}
                </h3>
                <p style={{ 
                  fontSize: '14px', 
                  color: 'var(--text-secondary)', 
                  lineHeight: '1.6', 
                  margin: 0,
                  maxHeight: '44px',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sports Section */}
      <section id="sports-section" style={{
        padding: '96px 24px',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-surface)'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span className="label-style">Available Venues</span>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>
              Choose Your Sport
            </h2>
          </div>

          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }} className="mobile-grid-1">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} style={{
                  height: '340px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-elevated)',
                  opacity: 0.3,
                  animation: 'pulse-shimmer 1.5s infinite ease-in-out'
                }} />
              ))}
              <style>{`
                @keyframes pulse-shimmer {
                  0%, 100% { opacity: 0.3; }
                  50% { opacity: 0.5; }
                }
                @media (max-width: 768px) {
                  .mobile-grid-1 {
                    grid-template-columns: 1fr !important;
                  }
                }
              `}</style>
            </div>
          )}

          {error && (
            <div style={{ 
              textAlign: 'center', 
              padding: '48px', 
              backgroundColor: 'var(--bg-base)', 
              border: '1px solid var(--border)', 
              borderRadius: '12px',
              color: 'var(--danger)'
            }}>
              <p style={{ fontSize: '14px' }}>{error}</p>
            </div>
          )}

          {!loading && !error && sports.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '48px', 
              backgroundColor: 'var(--bg-base)', 
              border: '1px dashed var(--border)', 
              borderRadius: '12px'
            }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                No sports available at the moment. Check back soon!
              </p>
            </div>
          )}

          {!loading && !error && sports.length > 0 && (
            <motion.div 
              variants={listContainerVariants}
              initial="hidden"
              animate="visible"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}
              className="mobile-grid-1"
            >
              {sports.map((sport, i) => (
                <SportCard key={sport._id} sport={sport} index={i} />
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </motion.div>
  );
};

export default LandingPage;
