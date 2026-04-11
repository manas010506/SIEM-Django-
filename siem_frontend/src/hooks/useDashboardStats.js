import { useState, useEffect } from 'react';
import { fetchDashboardStats } from '../services/api';

const useDashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const data = await fetchDashboardStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return { stats, isLoading, error, refetch: loadStats };
};

export default useDashboardStats;
