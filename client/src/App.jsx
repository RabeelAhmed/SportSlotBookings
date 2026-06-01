import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Toast notifications */}
      <Toaster position="top-right" />

      {/* Header / Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-indigo-600">SportSlot</span>
            </div>
            
            <nav className="flex space-x-6 text-sm font-medium text-gray-600">
              <Link to="/" className="hover:text-indigo-600 transition-colors">Home</Link>
              <Link to="/sport/tennis-court-1" className="hover:text-indigo-600 transition-colors">Tennis Slots</Link>
              <Link to="/booking/booking-789" className="hover:text-indigo-600 transition-colors">Demo Booking</Link>
              <Link to="/my-bookings" className="hover:text-indigo-600 transition-colors">My Bookings</Link>
              <Link to="/admin" className="hover:text-indigo-600 transition-colors">Admin</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} SportSlot. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
