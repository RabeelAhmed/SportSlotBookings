import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { formatHourLabel } from '../components/TimeSlotGrid';

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const formatPaymentMethod = (method) => {
  if (method === 'stripe_card') return '💳 Card (Stripe)';
  if (method === 'easypaisa')   return '📱 Easypaisa';
  if (method === 'jazzcash')    return '📱 JazzCash';
  return method || '—';
};

// ── Inline keyframes injected once ──────────────────────────────────────────
const STYLES = `
  @keyframes ci-fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ci-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.35); }
    50%       { box-shadow: 0 0 0 18px rgba(34,197,94,0); }
  }
  @keyframes ci-spin {
    to { transform: rotate(360deg); }
  }
  .ci-card  { animation: ci-fadeUp 0.45s ease both; }
  .ci-badge { animation: ci-pulse 2.2s ease-in-out infinite; }
  .ci-spin  { animation: ci-spin 0.9s linear infinite; }
`;

// ── Shared page shell ─────────────────────────────────────────────────────────
const Shell = ({ children }) => (
  <>
    <style>{STYLES}</style>
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #0a0f1e 0%, #0d1a2e 60%, #0a1628 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      {/* Logo strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px',
        }}>🏟️</div>
        <span style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.03em' }}>
          Sport<span style={{ color: '#60a5fa' }}>Slot</span>
        </span>
      </div>
      {children}
    </div>
  </>
);

// ── Row helper ────────────────────────────────────────────────────────────────
const Row = ({ label, value, last }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '11px 0',
    borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.07)',
  }}>
    <span style={{ fontSize: '13px', color: '#94a3b8' }}>{label}</span>
    <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', maxWidth: '55%', textAlign: 'right' }}>{value || '—'}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const CheckinPage = () => {
  const { bookingRef } = useParams();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingRef) { setLoading(false); return; }
    axios.get(`/api/bookings/checkin/${bookingRef}`)
      .then(res  => { setData(res.data); setLoading(false); })
      .catch(err => {
        setData({ found: false, serverError: err.response?.status !== 404 });
        setLoading(false);
      });
  }, [bookingRef]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Shell>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <div className="ci-spin" style={{
            width: '36px', height: '36px', borderRadius: '50%',
            border: '3px solid rgba(96,165,250,0.2)',
            borderTopColor: '#60a5fa',
          }} />
          <span style={{ fontSize: '14px', color: '#64748b' }}>Verifying booking…</span>
        </div>
      </Shell>
    );
  }

  // ── Not found / server error ─────────────────────────────────────────────
  if (!data || !data.found) {
    return (
      <Shell>
        <div className="ci-card" style={{
          width: '100%', maxWidth: '380px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.35)',
          borderRadius: '16px', padding: '32px 28px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', lineHeight: 1 }}>❌</div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#f87171' }}>
            {data?.serverError ? 'Server Error' : 'Invalid QR Code'}
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>
            {data?.serverError
              ? 'Something went wrong. Please try again.'
              : 'No booking found for this reference. Please contact court management.'}
          </p>
          <div style={{
            marginTop: '8px', padding: '8px 14px', borderRadius: '8px',
            background: 'rgba(239,68,68,0.12)', fontSize: '12px',
            color: '#f87171', fontWeight: 600, letterSpacing: '0.06em',
          }}>
            REF: {bookingRef || 'UNKNOWN'}
          </div>
        </div>
      </Shell>
    );
  }

  // ── Pending payment ──────────────────────────────────────────────────────
  if (data.status === 'pending_payment') {
    return (
      <Shell>
        <div className="ci-card" style={{
          width: '100%', maxWidth: '380px',
          background: 'rgba(234,179,8,0.08)',
          border: '1px solid rgba(234,179,8,0.35)',
          borderRadius: '16px', padding: '32px 28px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', lineHeight: 1 }}>⏳</div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#fbbf24' }}>Payment Pending</h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>
            This booking has not been paid yet and cannot be used for court entry.
          </p>
        </div>
      </Shell>
    );
  }

  // ── Cancelled ────────────────────────────────────────────────────────────
  if (data.status === 'cancelled') {
    return (
      <Shell>
        <div className="ci-card" style={{
          width: '100%', maxWidth: '380px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.35)',
          borderRadius: '16px', padding: '32px 28px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', lineHeight: 1 }}>🚫</div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#f87171' }}>Booking Cancelled</h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>
            This booking has been cancelled and is no longer valid for court entry.
          </p>
        </div>
      </Shell>
    );
  }

  // ── Confirmed ✅ ──────────────────────────────────────────────────────────
  const isCheckedIn = data.checkedIn;

  return (
    <Shell>
      <div className="ci-card" style={{
        width: '100%', maxWidth: '390px',
        background: 'linear-gradient(160deg, rgba(16,30,54,0.95) 0%, rgba(10,20,40,0.98) 100%)',
        border: '1px solid rgba(34,197,94,0.3)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,197,94,0.15)',
      }}>

        {/* ── Green header band ── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(16,185,129,0.12) 100%)',
          borderBottom: '1px solid rgba(34,197,94,0.2)',
          padding: '28px 28px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
        }}>
          {/* Pulsing check badge */}
          <div className="ci-badge" style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px',
          }}>✓</div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em',
              color: '#4ade80', textTransform: 'uppercase', marginBottom: '6px',
            }}>
              COURT CHECK-IN · VERIFIED
            </div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#f1f5f9' }}>
              {data.sport?.name} Court
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#94a3b8' }}>
              {formatDisplayDate(data.date)}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '15px', fontWeight: 600, color: '#60a5fa' }}>
              {formatHourLabel(data.startTime)} – {formatHourLabel(data.endTime)}
              <span style={{ fontSize: '12px', fontWeight: 400, color: '#64748b', marginLeft: '6px' }}>
                ({data.durationHours} hr{data.durationHours !== 1 ? 's' : ''})
              </span>
            </p>
          </div>

          {/* Check-in badge */}
          {isCheckedIn && (
            <div style={{
              padding: '6px 16px', borderRadius: '20px',
              background: 'rgba(34,197,94,0.2)',
              border: '1px solid rgba(34,197,94,0.4)',
              fontSize: '12px', fontWeight: 700,
              color: '#4ade80', letterSpacing: '0.06em',
            }}>
              ✓ CHECKED IN
            </div>
          )}
        </div>

        {/* ── Details grid ── */}
        <div style={{ padding: '20px 28px' }}>
          <Row label="Guest Name"   value={data.userName} />
          <Row label="Contact"      value={data.userPhone} />
          <Row label="Booking Ref"  value={data.bookingReference} />
          <Row label="Amount Paid"  value={data.totalPrice ? `Rs. ${data.totalPrice.toLocaleString()}` : '—'} />
          <Row label="Payment Via"  value={formatPaymentMethod(data.paymentMethod)} />
          <Row label="Status"       value={isCheckedIn ? '✅ Checked In' : '🟢 Confirmed'}  last />
        </div>

        {/* ── Footer ── */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '14px 28px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: '11px', color: '#475569' }}>
            Powered by SportSlot
          </span>
          {data.confirmedAt && (
            <span style={{ fontSize: '11px', color: '#475569' }}>
              Confirmed {new Date(data.confirmedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </span>
          )}
        </div>
      </div>

      <p style={{ marginTop: '20px', fontSize: '12px', color: '#334155', textAlign: 'center' }}>
        Present this screen to court management for entry
      </p>
    </Shell>
  );
};

export default CheckinPage;
