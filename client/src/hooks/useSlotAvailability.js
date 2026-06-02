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
      setSlots(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load slots');
    } finally {
      setLoading(false);
    }
  }, [sportId, date]);

  // Fetch initial data
  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Listen for socket events
  useEffect(() => {
    if (!socket || !sportId || !date) return;

    const handleSlotUpdate = (data) => {
      // payload looks like { sportId, date, startTime, endTime, status }
      if (data.sportId === sportId && data.date === date) {
        setSlots((prevSlots) => {
          return prevSlots.map((slot) => {
            if (slot.hour >= data.startTime && slot.hour < data.endTime) {
              // Convert server event status to UI slot status
              let newStatus = 'available';
              if (data.status === 'pending' || data.status === 'confirmed') {
                newStatus = 'booked';
              } else if (data.status === 'available') {
                newStatus = 'available';
              }
              return { ...slot, status: newStatus };
            }
            return slot;
          });
        });
      }
    };

    socket.on('slot_update', handleSlotUpdate);

    return () => {
      socket.off('slot_update', handleSlotUpdate);
    };
  }, [socket, sportId, date]);

  return { slots, loading, error, refetch: fetchSlots };
};
