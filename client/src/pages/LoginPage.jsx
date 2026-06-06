import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import AuthContext from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useContext(AuthContext);

  const [formData, setFormData] = useState({ email: '', password: '' });
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
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
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

    const result = await login(formData);
    
    setIsSubmitting(false);

    if (!result.success) {
      setServerError(result.message);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    toast('Contact court admin to reset password', {
      style: {
        background: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border)'
      }
    });
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
        style={{ width: '100%', maxWidth: '400px' }}
      >
        <div className="card" style={{ padding: '32px 24px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              Welcome Back
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              Login to manage your bookings
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

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="label-style" style={{ margin: 0 }}>
                  Password
                </label>
                <button 
                  type="button" 
                  onClick={handleForgotPassword} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: 'var(--accent)', 
                    fontSize: '12px', 
                    cursor: 'pointer', 
                    padding: 0 
                  }}
                >
                  Forgot?
                </button>
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                placeholder="••••••••"
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{ width: '100%', marginTop: '8px', height: '40px' }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" />
                  <span>Logging in...</span>
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            New here? <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Register</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
