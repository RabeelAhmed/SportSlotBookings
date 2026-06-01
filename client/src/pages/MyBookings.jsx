import React from 'react';

const MyBookings = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">My Bookings</h1>
      <p className="text-gray-600 font-medium">
        List of your reserved slots will appear here.
      </p>
    </div>
  );
};

export default MyBookings;
