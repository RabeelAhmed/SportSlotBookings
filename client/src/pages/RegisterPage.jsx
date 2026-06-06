import { useState, useEffect, useContext } from 'react';
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

    const { confirmPassword: _confirmPassword, ...registerData } = formData;
    const result = await register(registerData);
    
    setIsSubmitting(false);

    if (!result.success) {
      setServerError(result.message);
    }
  };

  const pageVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.25, ease: 'easeOut' } 
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-base)', padding: '24px' }}>
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        style={{ width: '100%', maxWidth: '440px', marginTop: '40px', marginBottom: '40px' }}
      >
        <div className="card" style={{ padding: '32px 24px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              Create Account
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              Join SportSlot to start booking courts
            </p>
          </div>

          {serverError && (
            <div 
              style={{ 
                backgroundColor: 'var(--danger-muted)', 
                border: '1px solid var(--danger)', 
                color: 'var(--danger)', 
                padding: '10px 12px', 
                borderRadius: '8px', 
                marginBottom: '16px', 
                fontSize: '13px', 
                textAlign: 'center' 
              }}
            >
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="label-style" style={{ display: 'block', marginBottom: '6px' }}>
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                placeholder="John Doe"
                style={{ 
                  borderColor: errors.name ? 'var(--danger)' : 'var(--border)'
                }}
              />
              {errors.name && (
                <div style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '4px' }}>
                  {errors.name}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="mobile-grid-1">
              <div>
                <label className="label-style" style={{ display: 'block', marginBottom: '6px' }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="03XX-XXXXXXX"
                  style={{ 
                    borderColor: errors.phone ? 'var(--danger)' : 'var(--border)'
                  }}
                />
                {errors.phone && (
                  <div style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '4px' }}>
                    {errors.phone}
                  </div>
                )}
              </div>

              <div>
                <label className="label-style" style={{ display: 'block', marginBottom: '6px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="you@example.com"
                  style={{ 
                    borderColor: errors.email ? 'var(--danger)' : 'var(--border)'
                  }}
                />
                {errors.email && (
                  <div style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '4px' }}>
                    {errors.email}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="label-style" style={{ display: 'block', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                placeholder="Min 8 characters"
                style={{ 
                  borderColor: errors.password ? 'var(--danger)' : 'var(--border)'
                }}
              />
              {errors.password && (
                <div style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '4px' }}>
                  {errors.password}
                </div>
              )}
            </div>

            <div>
              <label className="label-style" style={{ display: 'block', marginBottom: '6px' }}>
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field"
                placeholder="Re-enter password"
                style={{ 
                  borderColor: errors.confirmPassword ? 'var(--danger)' : 'var(--border)'
                }}
              />
              {errors.confirmPassword && (
                <div style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '4px' }}>
                  {errors.confirmPassword}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{ width: '100%', marginTop: '8px', height: '40px' }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" />
                  <span>Creating account...</span>
                </>
              ) : (
                'Register'
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Login</Link>
          </div>
        </div>
      </motion.div>
      <style>{`
        @media (max-width: 480px) {
          .mobile-grid-1 {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;
