import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#13131A',
            color: '#F0F0F5',
            border: '1px solid rgba(255,255,255,0.1)',
            fontFamily: "'Inter', sans-serif",
          },
          success: { iconTheme: { primary: '#00FF87', secondary: '#0A0A0F' } },
        }}
      />
      <Outlet />
    </AuthProvider>
  );
}

export default App;
