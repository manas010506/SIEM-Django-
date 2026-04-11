import { useState, useEffect, useCallback } from 'react';
import { fetchLogs } from '../services/api';

const useLogs = (initialFilters = {}, initialPage = 1) => {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({
    page: initialPage,
    totalCount: 0,
    totalPages: 1,
    pageSize: 50 // Assuming backend default or setting a standard
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Clean up empty filters
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '' && v !== 'ALL')
      );
      
      const queryParams = {
        ...cleanFilters,
        page: pagination.page
      };
      
      const data = await fetchLogs(queryParams);
      
      // Handle Django DRF pagination format
      if (data.results) {
        setLogs(data.results);
        setPagination(prev => ({
          ...prev,
          totalCount: data.count,
          totalPages: Math.ceil(data.count / prev.pageSize) || 1
        }));
      } else {
        // Fallback if not paginated
        setLogs(data);
        setPagination(prev => ({ ...prev, totalCount: data.length, totalPages: 1 }));
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to load logs:', err);
      // Don't show confusing error if it's just a 404 for an empty page
      if (err.response?.status === 404 && pagination.page > 1) {
        setLogs([]);
      } else {
        setError(err.response?.data?.error || 'Failed to fetch system logs');
      }
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
  };

  const setPage = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  return { 
    logs, 
    filters,
    pagination,
    isLoading, 
    error, 
    updateFilters, 
    setPage,
    refetch: loadLogs
  };
};

export default useLogs;
