import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  LuCircleCheck, 
  LuTriangleAlert, 
  LuCircleX, 
  LuLoaderCircle, 
  LuRefreshCw,
  LuCamera
} from 'react-icons/lu';
import AuthContext from '../context/AuthContext';
import AdminSidebar from '../components/AdminSidebar';
import { formatHourLabel } from '../components/TimeSlotGrid';

const AdminQRScanner = () => {
  const navigate = useNavigate();
  const { isAdmin, token, loading: authLoading } = useContext(AuthContext);

  const [scanning, setScanning] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Access control
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast.error('Access Denied');
      navigate('/');
    }
  }, [isAdmin, authLoading, navigate]);

  // QR Scanner Initialization
  useEffect(() => {
    if (!isAdmin || !scanning) return;

    // Small delay to ensure container DOM element is fully mounted
    const timer = setTimeout(() => {
      const containerId = "reader";
      const element = document.getElementById(containerId);
      if (!element) return;

      const html5QrCode = new Html5Qrcode(containerId);
      html5QrCodeRef.current = html5QrCode;

      const config = { 
        fps: 10, 
        qrbox: (width, height) => {
          const minDim = Math.min(width, height);
          const boxSize = Math.floor(minDim * 0.7);
          return { width: boxSize, height: boxSize };
        }
      };

      html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        (_errorMessage) => {
          // Keep scanning silently
        }
      ).catch(err => {
        console.error("Camera initialization error:", err);
        setCameraError("Unable to access camera. Please check permissions.");
      });
    }, 150);

    return () => {
      clearTimeout(timer);
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().catch(err => {
            console.error("Error stopping scanner on unmount:", err);
          });
        }
      }
    };
  }, [isAdmin, scanning]);

  const handleScanSuccess = async (decodedText) => {
    // Stop scanning immediately
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error("Failed to stop scanner on success:", err);
      }
    }

    setScanning(false);
    setVerifying(true);
    setCameraError(null);

    try {
      // 1. Parse JSON from QR code
      let qrData;
      try {
        qrData = JSON.parse(decodedText);
      } catch (e) {
        setResult({
          status: 'red',
          title: 'Invalid QR Code',
          message: 'The scanned code is not a valid SportSlot ticket.',
          detail: 'Failed to parse QR JSON structure.'
        });
        setVerifying(false);
        return;
      }

      const { bookingRef } = qrData;
      if (!bookingRef) {
        setResult({
          status: 'red',
          title: 'Invalid QR Code',
          message: 'The scanned code does not contain a booking reference.',
          detail: 'Missing bookingRef field.'
        });
        setVerifying(false);
        return;
      }

      // 2. Call backend verification endpoint
      const { data } = await axios.get(`/api/admin/bookings/verify/${bookingRef}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.valid) {
        setResult({
          status: 'green',
          title: 'Booking Verified',
          booking: data.booking
        });
      } else {
        if (data.reason === 'payment_pending') {
          setResult({
            status: 'yellow',
            title: 'Payment Pending',
            message: 'Payment Pending — not yet confirmed',
            booking: data.booking
          });
        } else if (data.reason === 'cancelled') {
          setResult({
            status: 'red',
            title: 'Booking Cancelled',
            message: 'Booking Cancelled',
            booking: data.booking
          });
        } else if (data.reason === 'wrong_date_time') {
          setResult({
            status: 'red',
            title: 'Wrong Date/Time',
            message: data.message || 'Wrong date/time',
            booking: data.booking
          });
        } else {
          setResult({
            status: 'red',
            title: 'Validation Failed',
            message: data.message || 'Ticket is invalid.',
            booking: data.booking
          });
        }
      }

    } catch (err) {
      console.error("Error verifying QR scan:", err);
      const errMsg = err.response?.data?.message || 'Server connection failed.';
      const reason = err.response?.data?.reason;

      if (reason === 'invalid_qr') {
        setResult({
          status: 'red',
          title: 'Invalid Ticket',
          message: 'No matching booking found in system databases.'
        });
      } else {
        setResult({
          status: 'red',
          title: 'Verification Failed',
          message: errMsg
        });
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleScanAgain = () => {
    setResult(null);
    setCameraError(null);
    setScanning(true);
  };

  const handleConfirmShortcut = async (id) => {
    try {
      setVerifying(true);
      const { data } = await axios.patch(`/api/admin/bookings/${id}/confirm-payment`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Payment confirmed & ticket updated.');
      
      // Refresh verification result to show valid green card
      setResult({
        status: 'green',
        title: 'Booking Verified',
        booking: data
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm payment.');
    } finally {
      setVerifying(false);
    }
  };

  if (authLoading || !isAdmin) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'var(--font)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flex: 1, paddingTop: '56px' }} className="admin-layout">
        <AdminSidebar activeTab="qr" />

        <main style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '480px' }}>
            
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 6px 0' }}>QR Entrance Scanner</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Verify customer bookings at complex gates</p>
            </div>

            {/* Main Scanner Card */}
            <div className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <AnimatePresence mode="wait">
                
                {/* 1. Camera Viewfinder */}
                {scanning && (
                  <motion.div
                    key="viewfinder"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}
                  >
                    {cameraError ? (
                      <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--danger)' }}>
                        <LuCircleX size={48} style={{ marginBottom: '12px', opacity: 0.8 }} />
                        <p style={{ fontSize: '14px', fontWeight: 500 }}>{cameraError}</p>
                        <button className="btn-secondary" onClick={handleScanAgain} style={{ marginTop: '16px', height: '36px' }}>
                          <LuRefreshCw size={14} style={{ marginRight: '6px' }} /> Retry Camera
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ 
                          width: '100%', 
                          aspectRatio: '1', 
                          maxWidth: '320px',
                          borderRadius: '16px',
                          overflow: 'hidden', 
                          border: '2px solid var(--border)',
                          background: '#07070a',
                          position: 'relative',
                          boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
                        }}>
                          {/* HTML5 QR Code Mount Node */}
                          <div id="reader" style={{ width: '100%', height: '100%' }}></div>
                          
                          {/* Animated Scan Line */}
                          <div className="scan-line-overlay" />
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                          <LuCamera size={16} className="text-accent animate-pulse" />
                          <span>Scanning with back camera...</span>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {/* 2. Loading State */}
                {verifying && (
                  <motion.div
                    key="verifying"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '260px', gap: '16px' }}
                  >
                    <LuLoaderCircle size={36} className="spinner" style={{ color: 'var(--accent)' }} />
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Verifying booking database...</span>
                  </motion.div>
                )}

                {/* 3. Scan Results (Cards) */}
                {!scanning && !verifying && result && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
                  >
                    
                    {/* GREEN CARD */}
                    {result.status === 'green' && (
                      <div style={{
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        borderRadius: '12px',
                        padding: '20px',
                        display: 'flex',
                        gap: '16px'
                      }}>
                        <div style={{ color: 'var(--success)' }}>
                          <LuCircleCheck size={28} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#10B981', margin: '0 0 2px 0' }}>{result.title}</h3>
                            <span style={{ fontSize: '12px', color: 'rgba(16, 185, 129, 0.8)', fontWeight: 500 }}>CHECK-IN GRANTED</span>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', borderTop: '1px solid rgba(16, 185, 129, 0.12)', paddingTop: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
                              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{result.booking.user?.name || 'Unknown User'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Sport:</span>
                              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{result.booking.sport?.name}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Date:</span>
                              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{result.booking.date}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Slot:</span>
                              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                {formatHourLabel(result.booking.startTime)} - {formatHourLabel(result.booking.endTime)}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Ref:</span>
                              <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{result.booking.bookingReference}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* YELLOW CARD */}
                    {result.status === 'yellow' && (
                      <div style={{
                        background: 'rgba(245, 158, 11, 0.08)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        borderRadius: '12px',
                        padding: '20px',
                        display: 'flex',
                        gap: '16px'
                      }}>
                        <div style={{ color: 'var(--warning)' }}>
                          <LuTriangleAlert size={28} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#F59E0B', margin: '0 0 2px 0' }}>{result.title}</h3>
                            <span style={{ fontSize: '12px', color: 'rgba(245, 158, 11, 0.8)', fontWeight: 500 }}>PAYMENT REQUIRED</span>
                          </div>
                          
                          <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>
                            {result.message}
                          </p>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', borderTop: '1px solid rgba(245, 158, 11, 0.12)', paddingTop: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
                              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{result.booking.user?.name || 'Unknown User'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Sport:</span>
                              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{result.booking.sport?.name}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Date:</span>
                              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{result.booking.date}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Time:</span>
                              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                {formatHourLabel(result.booking.startTime)} - {formatHourLabel(result.booking.endTime)}
                              </span>
                            </div>
                          </div>

                          {/* Confirm Shortcut button */}
                          <button 
                            className="btn-primary" 
                            onClick={() => handleConfirmShortcut(result.booking._id)}
                            style={{ alignSelf: 'flex-start', height: '32px', padding: '0 12px', fontSize: '12px', marginTop: '4px' }}
                          >
                            Receive Cash & Verify Ticket
                          </button>
                        </div>
                      </div>
                    )}

                    {/* RED CARD */}
                    {result.status === 'red' && (
                      <div style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '12px',
                        padding: '20px',
                        display: 'flex',
                        gap: '16px'
                      }}>
                        <div style={{ color: 'var(--danger)' }}>
                          <LuXCircle size={28} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#EF4444', margin: '0 0 2px 0' }}>{result.title}</h3>
                            <span style={{ fontSize: '12px', color: 'rgba(239, 68, 68, 0.8)', fontWeight: 500 }}>ENTRY DENIED</span>
                          </div>
                          
                          <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, fontWeight: 500 }}>
                            {result.message}
                          </p>

                          {result.booking && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', borderTop: '1px solid rgba(239, 68, 68, 0.12)', paddingTop: '12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
                                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{result.booking.user?.name || 'Unknown User'}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Sport:</span>
                                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{result.booking.sport?.name}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Date:</span>
                                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{result.booking.date}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Time Slot:</span>
                                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                  {formatHourLabel(result.booking.startTime)} - {formatHourLabel(result.booking.endTime)}
                                </span>
                              </div>
                            </div>
                          )}

                          {result.detail && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{result.detail}</span>
                          )}
                        </div>
                      </div>
                    )}

                    <button 
                      className="btn-primary" 
                      onClick={handleScanAgain}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <LuRefreshCw size={16} />
                      Scan Another Code
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        .scan-line-overlay {
          position: absolute;
          inset: 0 0 auto 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          box-shadow: 0 0 8px var(--accent);
          opacity: 0.6;
          animation: scan 2s linear infinite;
          pointer-events: none;
          z-index: 5;
        }

        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }

        #reader video {
          object-fit: cover !important;
          border-radius: 12px;
        }

        #reader__scan_region {
          border: none !important;
        }

        #reader__dashboard {
          display: none !important;
        }

        @media (max-width: 768px) {
          .admin-layout { flex-direction: column !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminQRScanner;
