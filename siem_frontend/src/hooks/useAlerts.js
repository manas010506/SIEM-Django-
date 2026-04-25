import { useState, useEffect, useCallback } from 'react';
import { fetchAlerts, acknowledgeAlert as apiAck, resolveAlert as apiResolve } from '../services/api';

const useAlerts = (initialFilters = {}) => {
  const [alerts, setAlerts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '' && v !== 'ALL')
      );
      const data = await fetchAlerts(cleanFilters);
      setAlerts(data.results || data || []);
      // ✅ Use real total count from API pagination
      setTotalCount(data.count || (data.results || data || []).length);
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
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a));
      // ✅ Decrease count when acknowledged
      setTotalCount(prev => Math.max(0, prev - 1));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const resolveAlert = async (id, notes) => {
    try {
      await apiResolve(id, notes);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'RESOLVED' } : a));
      // ✅ Decrease count when resolved
      setTotalCount(prev => Math.max(0, prev - 1));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return {
    alerts,
    totalCount,
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