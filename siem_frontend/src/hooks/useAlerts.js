import { useState, useEffect, useCallback } from 'react';
import { fetchAlerts, acknowledgeAlert as apiAck, resolveAlert as apiResolve } from '../services/api';

const useAlerts = (initialFilters = {}) => {
  const [alerts, setAlerts] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      // Clean up empty filters
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '' && v !== 'ALL')
      );
      
      const data = await fetchAlerts(cleanFilters);
      // The API might return { count, results } or just an array
      setAlerts(data.results || data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load alerts:', err);
      setError(err.response?.data?.error || 'Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const acknowledgeAlert = async (id) => {
    try {
      await apiAck(id);
      // Optimistic update
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const resolveAlert = async (id, notes) => {
    try {
      await apiResolve(id, notes);
      // Optimistic update
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'RESOLVED' } : a));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return { 
    alerts, 
    filters, 
    isLoading, 
    error, 
    updateFilters, 
    refetch: loadAlerts,
    acknowledgeAlert,
    resolveAlert
  };
};

export default useAlerts;
