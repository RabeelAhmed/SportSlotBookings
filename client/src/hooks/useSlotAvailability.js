import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSocket } from './useSocket.js';

export const useSlotAvailability = (sportId, date) => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const socket = useSocket();

  const fetchSlots = useCallback(async () => {
    if (!sportId || !date) return;

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/bookings/availability?sportId=${sportId}&date=${date}`);
      // Server returns all 24 hours; filter/mark as needed
      const data = Array.isArray(response.data) ? response.data : [];
      setSlots(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load slots');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [sportId, date]);

  // Fetch on mount / when sport or date changes
  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Real-time socket updates
  useEffect(() => {
    if (!socket || !sportId || !date) return;

    const handleSlotUpdate = (data) => {
      // payload: { sportId, date, startTime, endTime, status }
      if (data.sportId !== sportId || data.date !== date) return;

      setSlots((prevSlots) =>
        prevSlots.map((slot) => {
          if (slot.hour >= data.startTime && slot.hour < data.endTime) {
            let newStatus = slot.status;

            if (data.status === 'pending') {
              // Booking just created — mark as pending (yellow hold)
              newStatus = 'pending';
            } else if (data.status === 'confirmed') {
              newStatus = 'booked';
            } else if (data.status === 'available') {
              // Booking cancelled / expired — restore based on hour
              newStatus =
                slot.hour >= 9 && slot.hour < 25 ? 'available' : 'closed';
            }

            return { ...slot, status: newStatus };
          }
          return slot;
        })
      );
    };

    socket.on('slot_update', handleSlotUpdate);
    return () => socket.off('slot_update', handleSlotUpdate);
  }, [socket, sportId, date]);

  return { slots, loading, error, refetch: fetchSlots };
};
