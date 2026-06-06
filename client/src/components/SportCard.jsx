import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const SportCard = ({ sport, index = 0 }) => {
  const navigate = useNavigate();

  const handleBook = (e) => {
    e?.stopPropagation();
    if (sport?._id) navigate('/sport/' + sport._id);
  };

  // Card entrance animations (child of the stagger parent)
  const cardVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.25, ease: "easeOut" } 
    }
  };

  // Determine solid background color for placeholder based on name
  const getPlaceholderBg = (name = '') => {
    const lc = name.toLowerCase();
    if (lc.includes('cricket')) return '#312E81'; // dark indigo
    if (lc.includes('football')) return '#064E3B'; // dark green
    return '#1E293B'; // slate
  };

  return (
    <motion.article
      variants={cardVariants}
      whileHover={{ y: 0 }} // No floating animation as per "No: floating animations"
      onClick={handleBook}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleBook()}
      role="button"
      aria-label={'Book ' + (sport?.name || 'court')}
      className="card"
      style={{
        cursor: 'pointer',
        transition: 'border-color 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '24px',
        height: '100%',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        outline: 'none',
        position: 'relative'
      }}
      // Hover border effect
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      {/* Top Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          {sport?.name || 'Sport'}
        </h3>
        <span className="badge badge-confirmed">
          Available Now
        </span>
      </div>

      {/* Sport Image or Solid Color Block (16:9 Aspect Ratio) */}
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        paddingTop: '56.25%', // 16:9 aspect ratio
        borderRadius: '8px', 
        overflow: 'hidden',
        backgroundColor: getPlaceholderBg(sport?.name)
      }}>
        {sport?.image ? (
          <img
            src={sport.image}
            alt={sport.name}
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%', 
              height: '100%', 
              objectFit: 'cover'
            }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : null}
      </div>

      {/* Sport Description */}
      {sport?.description ? (
        <p style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          lineHeight: '1.6',
          margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '44px'
        }}>
          {sport.description}
        </p>
      ) : (
        <div style={{ minHeight: '44px' }} />
      )}

      {/* Bottom Pricing & CTA */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: 'auto',
        paddingTop: '16px',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ 
            fontWeight: 500, 
            textTransform: 'uppercase', 
            letterSpacing: '0.08em', 
            fontSize: '11px', 
            color: '#64748B' 
          }}>
            Hourly Rate
          </span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
            Rs. 1,000 – 1,500
          </span>
        </div>
        <button 
          onClick={handleBook}
          className="btn-primary" 
          style={{ height: '36px', padding: '0 16px' }}
        >
          Book Slot
        </button>
      </div>
    </motion.article>
  );
};

export default SportCard;
