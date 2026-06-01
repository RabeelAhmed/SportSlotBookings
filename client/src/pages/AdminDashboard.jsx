import React from 'react';

const AdminDashboard = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Admin Dashboard</h1>
      <p className="text-gray-600 font-medium">
        Manage sports, bookings, and slots.
      </p>
    </div>
  );
};

export default AdminDashboard;
