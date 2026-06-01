import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import SportDetail from './pages/SportDetail.jsx'
import BookingDetail from './pages/BookingDetail.jsx'
import MyBookings from './pages/MyBookings.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="sport/:sportId" element={<SportDetail />} />
          <Route path="booking/:bookingId" element={<BookingDetail />} />
          <Route path="my-bookings" element={<MyBookings />} />
          <Route path="admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
