import React from 'react';
import { useParams } from 'react-router-dom';

const BookingDetail = () => {
  const { bookingId } = useParams();

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Booking Details</h1>
      <p className="text-gray-600 mb-2">
        Viewing details for Booking ID: <span className="font-semibold text-indigo-600">{bookingId}</span>
      </p>
    </div>
  );
};

export default BookingDetail;
