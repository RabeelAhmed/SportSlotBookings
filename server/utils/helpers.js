/**
 * Generates a random 8-character alphanumeric string.
 * @returns {string} The booking reference.
 */
const generateBookingReference = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Calculates the total price based on start time and end time.
 * Pricing rules:
 * - Hours 9 to 17: Rs. 1000 per hour
 * - Hours 17 to 25 (1 AM next day): Rs. 1500 per hour
 * @param {number} startTime - Start time (e.g., 9, 17)
 * @param {number} endTime - End time (e.g., 10, 18)
 * @returns {number} The calculated total price.
 */
const calculatePrice = (startTime, endTime) => {
  let totalPrice = 0;

  if (endTime <= startTime) {
    throw new Error('End time must be greater than start time');
  }

  for (let hour = startTime; hour < endTime; hour++) {
    if (hour >= 9 && hour < 17) {
      totalPrice += 1000;
    } else if (hour >= 17 && hour < 25) {
      totalPrice += 1500;
    } else {
      // You can define what happens outside of these hours (9 to 25).
      // If it should be completely disabled, throw an error.
      throw new Error(`Booking not allowed for hour: ${hour}`);
    }
  }

  return totalPrice;
};

module.exports = {
  generateBookingReference,
  calculatePrice,
};
