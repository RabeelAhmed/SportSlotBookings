import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import LandingPage from './pages/LandingPage.jsx'
import SportPage from './pages/SportPage.jsx'
import BookingPage from './pages/BookingPage.jsx'
import BookingConfirmationPage from './pages/BookingConfirmationPage.jsx'
import PaymentSuccessPage from './pages/PaymentSuccessPage.jsx'
import CheckinPage from './pages/CheckinPage.jsx'
import MyBookingsPage from './pages/MyBookingsPage.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminQRScanner from './pages/AdminQRScanner.jsx'
import AdminSports from './pages/AdminSports.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<LandingPage />} />
          <Route path="sport/:sportId" element={<SportPage />} />
          <Route path="booking/new" element={<BookingPage />} />
          <Route path="booking/:sessionId/success" element={<PaymentSuccessPage />} />
          <Route path="booking/:bookingId" element={<BookingConfirmationPage />} />
          <Route path="my-bookings" element={<MyBookingsPage />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/scanner" element={<AdminQRScanner />} />
          <Route path="admin/sports" element={<AdminSports />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>
        {/* Public check-in page — outside App wrapper so no nav/footer */}
        <Route path="/checkin/:bookingRef" element={<CheckinPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)

