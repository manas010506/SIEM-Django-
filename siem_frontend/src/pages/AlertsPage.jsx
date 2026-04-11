import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Filter } from 'lucide-react';
import useAlerts from '../hooks/useAlerts';
import AlertsTable from '../components/Alerts/AlertsTable';
import AlertModal from '../components/Alerts/AlertModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { initScrollTriggerRefresh } from '../main';
import styles from './AlertsPage.module.css';

const AlertsContent = () => {
  const { 
    alerts, 
    filters, 
    isLoading, 
    error, 
    updateFilters, 
    refetch,
    acknowledgeAlert,
    resolveAlert
  } = useAlerts({ severity: 'ALL', status: 'ALL' });
  
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && alerts?.length >= 0) {
      setTimeout(() => initScrollTriggerRefresh(), 100);
    }
  }, [isLoading, alerts]);

  const handleRowClick = (alert) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);
  };

  const activeAlertsCount = alerts?.filter(a => a.status !== 'RESOLVED').length || 0;

  if (error) {
    throw new Error(error);
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <h2 className={styles.title}>Security Alerts</h2>
          <span className={styles.badge}>{activeAlertsCount} Active</span>
        </div>
        
        <button 
          className={styles.refreshBtn} 
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? styles.spinning : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <motion.div 
        className={styles.filterBar}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className={styles.filterGroup}>
          <Filter size={16} className={styles.filterIcon} />
          <span className={styles.filterLabel}>Filters</span>
        </div>
        
        <div className={styles.selectGroup}>
          <label htmlFor="severity">Severity</label>
          <select 
            id="severity" 
            value={filters.severity}
            onChange={(e) => updateFilters({ severity: e.target.value })}
            className={styles.select}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        
        <div className={styles.selectGroup}>
          <label htmlFor="status">Status</label>
          <select 
            id="status" 
            value={filters.status}
            onChange={(e) => updateFilters({ status: e.target.value })}
            className={styles.select}
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className={styles.content}>
        {isLoading ? (
          <LoadingSpinner text="Retrieving security alerts..." />
        ) : (
          <AlertsTable alerts={alerts} onRowClick={handleRowClick} />
        )}
      </div>

      {/* Modal */}
      <AlertModal 
        alert={selectedAlert} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAcknowledge={acknowledgeAlert}
        onResolve={resolveAlert}
      />
    </div>
  );
};

const AlertsPage = () => {
  return (
    <ErrorBoundary>
      <AlertsContent />
    </ErrorBoundary>
  );
};

export default AlertsPage;
