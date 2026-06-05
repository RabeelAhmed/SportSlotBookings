import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuthContext from '../context/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isAuthenticated } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      const origin = location.state?.from?.pathname || '/';
      navigate(origin);
    }
  }, [isAuthenticated, navigate, location]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Full Name is required';
    }
    
    // Phone validation (03XX-XXXXXXX)
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^03\d{2}-\d{7}$/.test(formData.phone)) {
      newErrors.phone = 'Format must be 03XX-XXXXXXX';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setServerError('');

    // exclude confirmPassword before sending to API
    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);
    
    setIsSubmitting(false);

    if (!result.success) {
      setServerError(result.message);
    }
    // On success, isAuthenticated becomes true and useEffect will redirect
  };

  const inputStyle = (error) => ({
    width: '100%',
    padding: '0.85rem 1rem',
    background: '#13131A',
    border: `1px solid ${error ? '#FF5050' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: '0.75rem',
    color: '#F0F0F5',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s'
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0F', padding: '1.5rem', fontFamily: "'Inter', sans-serif" }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
        style={{ width: '100%', maxWidth: '460px', marginTop: '60px', marginBottom: '40px' }}
      >
        <div style={{ background: '#13131A', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.08)', padding: '2.5rem 2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#F0F0F5', margin: '0 0 0.5rem 0' }}>Create Account</h1>
            <p style={{ color: '#9898B0', fontSize: '0.9rem', margin: 0 }}>Join SportSlot to start booking courts</p>
          </div>

          {serverError && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{ background: 'rgba(255, 80, 80, 0.1)', border: '1px solid rgba(255, 80, 80, 0.3)', color: '#FF5050', padding: '0.75rem 1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}
            >
              {serverError}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', color: '#9898B0', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={inputStyle(errors.name)}
                placeholder="John Doe"
                onFocus={(e) => e.target.style.borderColor = '#00FF87'}
                onBlur={(e) => e.target.style.borderColor = errors.name ? '#FF5050' : 'rgba(255,255,255,0.1)'}
              />
              {errors.name && <div style={{ color: '#FF5050', fontSize: '0.75rem', marginTop: '0.4rem' }}>{errors.name}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', color: '#9898B0', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  style={inputStyle(errors.phone)}
                  placeholder="03XX-XXXXXXX"
                  onFocus={(e) => e.target.style.borderColor = '#00FF87'}
                  onBlur={(e) => e.target.style.borderColor = errors.phone ? '#FF5050' : 'rgba(255,255,255,0.1)'}
                />
                {errors.phone && <div style={{ color: '#FF5050', fontSize: '0.75rem', marginTop: '0.4rem' }}>{errors.phone}</div>}
              </div>

              <div>
                <label style={{ display: 'block', color: '#9898B0', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={inputStyle(errors.email)}
                  placeholder="you@example.com"
                  onFocus={(e) => e.target.style.borderColor = '#00FF87'}
                  onBlur={(e) => e.target.style.borderColor = errors.email ? '#FF5050' : 'rgba(255,255,255,0.1)'}
                />
                {errors.email && <div style={{ color: '#FF5050', fontSize: '0.75rem', marginTop: '0.4rem' }}>{errors.email}</div>}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: '#9898B0', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                style={inputStyle(errors.password)}
                placeholder="Min 8 characters"
                onFocus={(e) => e.target.style.borderColor = '#00FF87'}
                onBlur={(e) => e.target.style.borderColor = errors.password ? '#FF5050' : 'rgba(255,255,255,0.1)'}
              />
              {errors.password && <div style={{ color: '#FF5050', fontSize: '0.75rem', marginTop: '0.4rem' }}>{errors.password}</div>}
            </div>

            <div>
              <label style={{ display: 'block', color: '#9898B0', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                style={inputStyle(errors.confirmPassword)}
                placeholder="Re-enter password"
                onFocus={(e) => e.target.style.borderColor = '#00FF87'}
                onBlur={(e) => e.target.style.borderColor = errors.confirmPassword ? '#FF5050' : 'rgba(255,255,255,0.1)'}
              />
              {errors.confirmPassword && <div style={{ color: '#FF5050', fontSize: '0.75rem', marginTop: '0.4rem' }}>{errors.confirmPassword}</div>}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '0.9rem',
                background: 'linear-gradient(135deg,#00FF87,#00cc6a)',
                border: 'none',
                borderRadius: '0.75rem',
                color: '#0A0A0F',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: isSubmitting ? 0.8 : 1,
                boxShadow: '0 4px 20px rgba(0,255,135,0.2)'
              }}
            >
              {isSubmitting ? (
                <>
                  <svg className="spinner" viewBox="0 0 50 50" style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }}>
                    <circle cx="25" cy="25" r="20" fill="none" stroke="#0A0A0F" strokeWidth="4" strokeDasharray="90, 150" strokeLinecap="round" />
                  </svg>
                  Creating account...
                </>
              ) : (
                'Register'
              )}
            </motion.button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: '#9898B0' }}>
            Already have an account? <Link to="/login" style={{ color: '#00FF87', textDecoration: 'none', fontWeight: 600 }}>Login</Link>
          </div>
        </div>
      </motion.div>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default RegisterPage;
