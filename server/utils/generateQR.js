import QRCode from 'qrcode';

/**
 * Generate a booking QR code server-side.
 *
 * The QR encodes a PUBLIC URL → CLIENT_URL/checkin/BOOKING_REF
 * so any camera app (Google Lens, iPhone camera, etc.) opens it
 * directly as a clickable link showing the booking confirmation page.
 *
 * The raw JSON payload is stored separately in qrPayload for the
 * admin scanner to parse programmatically.
 *
 * @param {Object} booking  - Mongoose Booking document
 * @param {Object} user     - Mongoose User document
 * @param {Object} sport    - Mongoose Sport document
 * @returns {{ qrBase64: string, qrPayload: string }}
 */
export async function generateBookingQR(booking, user, sport) {
  // Store the full data payload for admin scanner use
  const payload = {
    ref:      booking.bookingReference,
    name:     user.name,
    phone:    user.phone,
    sport:    sport.name,
    date:     booking.date,
    start:    booking.startTime,
    end:      booking.endTime,
    duration: booking.durationHours,
    price:    booking.totalPrice,
    status:   'confirmed',
    issuedAt: new Date().toISOString(),
  };

  const qrPayload = JSON.stringify(payload);

  // The QR image itself encodes a scannable URL, not raw JSON
  // When scanned with any camera, it opens the booking confirmation page
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const checkinUrl = `${clientUrl}/checkin/${booking.bookingReference}`;

  const qrBase64 = await QRCode.toDataURL(checkinUrl, {
    errorCorrectionLevel: 'H',
    width: 400,
    margin: 2,
    color: {
      dark:  '#000000',
      light: '#FFFFFF',
    },
  });

  return { qrBase64, qrPayload };
}
