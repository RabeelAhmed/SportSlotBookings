import { useState, useContext } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { LuMenu, LuX } from 'react-icons/lu';
import { AuthProvider } from './context/AuthContext';
import AuthContext from './context/AuthContext';

const CourtIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--accent)' }}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);

function GlobalLayout() {
  const { user, isAuthenticated, isAdmin, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    setIsDrawerOpen(false);
    navigate('/');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isLinkActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const linkStyle = (path) => ({
    fontSize: '14px',
    fontWeight: isLinkActive(path) ? 500 : 400,
    color: isLinkActive(path) ? 'var(--text-primary)' : 'var(--text-secondary)',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
    cursor: 'pointer'
  });

  const showFooter = location.pathname !== '/admin' && location.pathname !== '/login' && location.pathname !== '/register';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      {/* Navbar */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '56px',
        backgroundColor: 'var(--bg-base)',
        borderBottom: '1px solid var(--border)',
        zIndex: 1000,
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <CourtIcon />
          <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            SportSlot
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: '24px' }}>
          <Link to="/" style={linkStyle('/')} className="hover:text-[var(--text-primary)]">Home</Link>
          <Link to="/my-bookings" style={linkStyle('/my-bookings')} className="hover:text-[var(--text-primary)]">My Bookings</Link>
          {isAdmin && <Link to="/admin" style={linkStyle('/admin')} className="hover:text-[var(--text-primary)]">Admin</Link>}
        </div>

        {/* Auth / Right Side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: '16px' }}>
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-primary)'
                }}>
                  {getInitials(user?.name || user?.email)}
                </div>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{user?.name || user?.email}</span>
                <span onClick={handleLogout} style={{ fontSize: '14px', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'color 0.2s' }} className="hover:text-[var(--text-primary)]">Logout</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link to="/login" className="btn-secondary" style={{ textDecoration: 'none' }}>Login</Link>
                <Link to="/register" className="btn-primary" style={{ textDecoration: 'none' }}>Register</Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Icon */}
          <button 
            className="md:hidden" 
            onClick={() => setIsDrawerOpen(true)}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px' }}
          >
            <LuMenu size={20} />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          onClick={() => setIsDrawerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 1005
          }}
        />
      )}

      {/* Mobile Drawer */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '260px',
        backgroundColor: 'var(--bg-base)',
        borderLeft: '1px solid var(--border)',
        transform: isDrawerOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.2s ease-in-out',
        zIndex: 1010,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Menu</span>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            <LuX size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Link to="/" onClick={() => setIsDrawerOpen(false)} style={linkStyle('/')}>Home</Link>
          <Link to="/my-bookings" onClick={() => setIsDrawerOpen(false)} style={linkStyle('/my-bookings')}>My Bookings</Link>
          {isAdmin && <Link to="/admin" onClick={() => setIsDrawerOpen(false)} style={linkStyle('/admin')}>Admin</Link>}
        </div>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-primary)'
                }}>
                  {getInitials(user?.name || user?.email)}
                </div>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || user?.email}</span>
              </div>
              <button onClick={handleLogout} className="btn-secondary" style={{ width: '100%' }}>Logout</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link to="/login" onClick={() => setIsDrawerOpen(false)} className="btn-secondary" style={{ textDecoration: 'none', width: '100%', textAlign: 'center' }}>Login</Link>
              <Link to="/register" onClick={() => setIsDrawerOpen(false)} className="btn-primary" style={{ textDecoration: 'none', width: '100%', textAlign: 'center' }}>Register</Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>

      {/* Footer */}
      {showFooter && (
        <footer style={{
          borderTop: '1px solid var(--border)',
          padding: '48px 24px',
          backgroundColor: 'var(--bg-base)',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CourtIcon />
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                SportSlot
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <span>Sports Complex, Main Road, Your City</span>
              <span>+92-300-0000000</span>
            </div>
            <div style={{ width: '100%', height: '1px', backgroundColor: 'var(--border-subtle)' }} />
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              &copy; {new Date().getFullYear()} SportSlot. All rights reserved.
            </span>
          </div>
        </footer>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            fontFamily: "var(--font)",
            fontSize: '14px',
            borderRadius: '8px',
          },
          success: {
            iconTheme: {
              primary: 'var(--success)',
              secondary: 'var(--bg-surface)'
            }
          },
          error: {
            iconTheme: {
              primary: 'var(--danger)',
              secondary: 'var(--bg-surface)'
            }
          }
        }}
      />
      <GlobalLayout />
    </AuthProvider>
  );
}

export default App;
