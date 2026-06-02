export const generateBookingReference = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const calculatePrice = (startTime, endTime) => {
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
      throw new Error(`Booking not allowed for hour: ${hour}`);
    }
  }
  return totalPrice;
};
