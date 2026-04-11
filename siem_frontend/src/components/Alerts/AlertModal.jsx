import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, CheckCircle, Clock } from 'lucide-react';
import SeverityBadge from './SeverityBadge';
import { formatDate, severityColor } from '../../utils/formatters';
import styles from './AlertModal.module.css';

const AlertModal = ({ alert, isOpen, onClose, onAcknowledge, onResolve }) => {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setResolutionNotes('');
      setIsResolving(false);
    }
  }, [isOpen, alert]);

  const handleResolve = () => {
    onResolve(alert.id, resolutionNotes);
    setIsResolving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && alert && (
        <motion.div 
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
        <motion.div 
          className={styles.modal}
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div 
            className={styles.header}
            style={{ borderTopColor: severityColor(alert.severity) }}
          >
            <div className={styles.headerContent}>
              <div 
                className={styles.iconWrapper}
                style={{ color: severityColor(alert.severity), backgroundColor: `${severityColor(alert.severity)}15` }}
              >
                <ShieldAlert size={24} />
              </div>
              <div className={styles.titleArea}>
                <h2>{alert.title}</h2>
                <div className={styles.badges}>
                  <SeverityBadge severity={alert.severity} />
                  <span className={`${styles.statusBadge} ${styles[alert.status.toLowerCase()] || ''}`}>
                    {alert.status}
                  </span>
                </div>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className={styles.body}>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Alert ID</span>
                <span className={styles.value}>#ALT-{alert.id}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Triggered At</span>
                <span className={styles.value}>{formatDate(alert.triggered_at)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Source IP</span>
                <span className={styles.valueIp}>{alert.source_ip || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Threat Score</span>
                <span className={styles.valueScore}>{alert.threat_score || 'N/A'}/100</span>
              </div>
            </div>

            <div className={styles.descriptionArea}>
              <span className={styles.label}>Description</span>
              <p className={styles.description}>{alert.description || 'No detailed description available.'}</p>
            </div>

            {isResolving && (
              <motion.div 
                className={styles.resolveArea}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <label className={styles.label} htmlFor="notes">Resolution Notes</label>
                <textarea 
                  id="notes"
                  className={styles.textarea} 
                  placeholder="Detail the actions taken to resolve this alert..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  autoFocus
                ></textarea>
              </motion.div>
            )}
          </div>

          {/* Footer Actions */}
          <div className={styles.footer}>
            <button className={styles.cancelBtn} onClick={onClose}>Close</button>
            <div className={styles.actions}>
              
              {alert.status === 'NEW' && (
                <button 
                  className={styles.ackBtn} 
                  onClick={() => { onAcknowledge(alert.id); onClose(); }}
                >
                  <Clock size={16} />
                  Acknowledge
                </button>
              )}
              
              {alert.status !== 'RESOLVED' && !isResolving && (
                <button 
                  className={styles.resolveBtn} 
                  onClick={() => setIsResolving(true)}
                >
                  <CheckCircle size={16} />
                  Mark Resolved
                </button>
              )}

              {isResolving && (
                <button 
                  className={styles.confirmResolveBtn} 
                  onClick={handleResolve}
                  disabled={resolutionNotes.length < 5}
                >
                  Confirm Resolution
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AlertModal;
