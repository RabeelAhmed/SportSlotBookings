import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LuLayoutDashboard, 
  LuCalendar, 
  LuQrCode, 
  LuActivity, 
  LuChevronLeft, 
  LuChevronRight 
} from 'react-icons/lu';

const AdminSidebar = ({ activeTab }) => {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('admin_sidebar_collapsed', next);
      return next;
    });
  };

  const handleTabClick = (tabId) => {
    if (tabId === 'dashboard') {
      navigate('/admin', { state: { tab: 'dashboard' } });
    } else if (tabId === 'bookings') {
      navigate('/admin', { state: { tab: 'bookings' } });
    } else if (tabId === 'qr') {
      navigate('/admin/scanner');
    } else if (tabId === 'sports') {
      navigate('/admin/sports');
    }
  };

  const tabs = [
    { id: 'dashboard', icon: <LuLayoutDashboard size={18} />, label: 'Dashboard' },
    { id: 'bookings', icon: <LuCalendar size={18} />, label: 'Bookings' },
    { id: 'qr', icon: <LuQrCode size={18} />, label: 'QR Scanner' },
    { id: 'sports', icon: <LuActivity size={18} />, label: 'Sports' },
  ];

  return (
    <aside 
      className="admin-sidebar" 
      style={{ 
        width: isSidebarCollapsed ? '64px' : '240px', 
        background: 'var(--bg-surface)', 
        borderRight: '1px solid var(--border)', 
        padding: '24px 12px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px',
        transition: 'width 0.2s ease',
        position: 'relative',
        zIndex: 10
      }}
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            style={{
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '12px',
              width: '100%',
              background: isActive ? 'var(--accent-muted)' : 'transparent',
              border: 'none', 
              borderRadius: '8px',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: isActive ? 500 : 400,
              cursor: 'pointer', 
              textAlign: 'left', 
              transition: 'all 0.2s',
              outline: 'none',
              overflow: 'hidden',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >
            {tab.icon}
            {!isSidebarCollapsed && <span style={{ fontSize: '13px' }}>{tab.label}</span>}
          </button>
        );
      })}

      {/* Sidebar Collapse Toggle Button */}
      <button
        onClick={toggleSidebar}
        style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '36px',
          width: '100%',
          background: 'none',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          outline: 'none'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
      >
        {isSidebarCollapsed ? <LuChevronRight size={18} /> : <LuChevronLeft size={18} />}
      </button>
    </aside>
  );
};

export default AdminSidebar;
