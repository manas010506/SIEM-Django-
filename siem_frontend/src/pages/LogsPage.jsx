import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Search, ChevronLeft, ChevronRight, X, Clock, Globe, Server, Activity } from 'lucide-react';
import useLogs from '../hooks/useLogs';
import LogsTable from '../components/Logs/LogsTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { initScrollTriggerRefresh } from '../main';
import styles from './LogsPage.module.css';

const LEVEL_COLORS = {
  CRITICAL: '#ff4d6d',
  ERROR: '#ff6b35',
  WARNING: '#ffd166',
  INFO: '#00d4ff',
  DEBUG: '#8899aa',
};

const LogsContent = () => {
  const { 
    logs, 
    filters,
    pagination,
    isLoading, 
    error, 
    updateFilters, 
    setPage 
  } = useLogs({ log_level: 'ALL', source_ip: '', event_type: '' });
  
  const [selectedLog, setSelectedLog] = useState(null);
  const [searchInputIp, setSearchInputIp] = useState(filters.source_ip || '');
  const [searchInputEvent, setSearchInputEvent] = useState(filters.event_type || '');

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => initScrollTriggerRefresh(), 100);
    }
  }, [isLoading, logs]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setSelectedLog(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleRowClick = (log) => {
    setSelectedLog(log);
  };

  const handleApplyFilters = () => {
    updateFilters({ 
      source_ip: searchInputIp, 
      event_type: searchInputEvent 
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleApplyFilters();
  };

  const handleExportCSV = () => {
    if (!logs || logs.length === 0) return;
    const headers = ['Timestamp', 'Level', 'Source IP', 'Destination IP', 'Event Type', 'Message'];
    const rows = logs.map(log => [
      new Date(log.timestamp).toISOString(),
      log.log_level,
      log.source_ip || '',
      log.destination_ip || '',
      log.event_type || '',
      `"${log.message.replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `siem_logs_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) throw new Error(error);

  return (
    <div className={styles.container}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <h2 className={styles.title}>System Logs</h2>
          <span className={styles.badge}>{pagination.totalCount.toLocaleString()} Total</span>
        </div>
        <button 
          className={styles.exportBtn} 
          onClick={handleExportCSV}
          disabled={isLoading || logs.length === 0}
        >
          <Download size={16} />
          <span>Export CSV</span>
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
          <label htmlFor="log_level">Log Level</label>
          <select 
            id="log_level" 
            value={filters.log_level}
            onChange={(e) => updateFilters({ log_level: e.target.value })}
            className={styles.select}
          >
            <option value="ALL">All Levels</option>
            <option value="DEBUG">Debug</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Warning</option>
            <option value="ERROR">Error</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
        
        <div className={styles.searchGroup}>
          <label htmlFor="source_ip">Source IP</label>
          <input 
            id="source_ip"
            type="text" 
            placeholder="e.g. 192.168.1.1"
            value={searchInputIp}
            onChange={(e) => setSearchInputIp(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.input}
          />
        </div>

        <div className={styles.searchGroup}>
          <label htmlFor="event_type">Event Type</label>
          <input 
            id="event_type"
            type="text" 
            placeholder="e.g. login_failed"
            value={searchInputEvent}
            onChange={(e) => setSearchInputEvent(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.input}
          />
        </div>
        
        <button className={styles.applyBtn} onClick={handleApplyFilters}>
          <Search size={16} />
          <span>Apply Filters</span>
        </button>
      </motion.div>

      {/* Main Content */}
      <div className={styles.content}>
        {isLoading ? (
          <LoadingSpinner text="Querying log index..." />
        ) : (
          <>
            <LogsTable logs={logs} onRowClick={handleRowClick} />
            
            {pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <button 
                  className={styles.pageBtn}
                  onClick={() => setPage(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft size={18} />
                </button>
                <span className={styles.pageInfo}>
                  Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong>
                </span>
                <button 
                  className={styles.pageBtn}
                  onClick={() => setPage(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Inline Modal ── */}
      {selectedLog && (
        <div className={styles.modal} onClick={() => setSelectedLog(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>

            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <span
                  className={styles.levelPill}
                  style={{ 
                    background: `${LEVEL_COLORS[selectedLog.log_level]}22`,
                    color: LEVEL_COLORS[selectedLog.log_level],
                    border: `1px solid ${LEVEL_COLORS[selectedLog.log_level]}`,
                  }}
                >
                  {selectedLog.log_level}
                </span>
                Log Entry Details
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedLog(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className={styles.modalBody}>

              {/* Message Box */}
              <div className={styles.messageBox}>
                <p className={styles.messageLabel}>Message</p>
                <p className={styles.messageText}>{selectedLog.message}</p>
              </div>

              {/* Detail Rows */}
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}><Clock size={14} /> Timestamp</span>
                <span className={styles.detailValue}>
                  {new Date(selectedLog.timestamp).toLocaleString()}
                </span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}><Globe size={14} /> Source IP</span>
                <span className={styles.detailValue}>{selectedLog.source_ip}</span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}><Server size={14} /> Destination IP</span>
                <span className={selectedLog.destination_ip ? styles.detailValue : styles.nullValue}>
                  {selectedLog.destination_ip || 'Not captured'}
                </span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}><Activity size={14} /> Event Type</span>
                <span className={styles.detailValue}>{selectedLog.event_type}</span>
              </div>

              {selectedLog.source_port && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Source Port</span>
                  <span className={styles.detailValue}>{selectedLog.source_port}</span>
                </div>
              )}

              {selectedLog.destination_port && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Destination Port</span>
                  <span className={styles.detailValue}>{selectedLog.destination_port}</span>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const LogsPage = () => (
  <ErrorBoundary>
    <LogsContent />
  </ErrorBoundary>
);

export default LogsPage;
