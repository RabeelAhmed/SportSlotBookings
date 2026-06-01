import React from 'react';
import { useParams } from 'react-router-dom';

const SportDetail = () => {
  const { sportId } = useParams();

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Sport Details</h1>
      <p className="text-gray-600 mb-2">
        Viewing slots for Sport ID: <span className="font-semibold text-indigo-600">{sportId}</span>
      </p>
    </div>
  );
};

export default SportDetail;
