import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Shield, Eye } from 'lucide-react';
import SeverityBadge from './SeverityBadge';
import { formatDate } from '../../utils/formatters';
import styles from './AlertsTable.module.css';

gsap.registerPlugin(ScrollTrigger);

const AlertsTable = ({ alerts, onRowClick }) => {
  const tableRef = useRef(null);
  const rowsRef = useRef([]);

  useEffect(() => {
    if (tableRef.current && alerts && alerts.length > 0) {
      // Clear existing scroll triggers to prevent duplicates on data change
      ScrollTrigger.getAll().forEach(t => {
        if (t.vars.trigger === tableRef.current || rowsRef.current.includes(t.vars.trigger)) {
          t.kill();
        }
      });

      // Animate table rows sequentially as they scroll into view
      ScrollTrigger.batch(rowsRef.current.filter(Boolean), {
        onEnter: (elements) => {
          gsap.fromTo(
            elements,
            { opacity: 0, y: 30 },
            { 
              opacity: 1, 
              y: 0, 
              stagger: 0.05, 
              duration: 0.4, 
              ease: 'power2.out',
              overwrite: true
            }
          );
        },
        start: 'top 95%',
      });
    }
  }, [alerts]);

  if (!alerts || alerts.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Shield size={48} className={styles.emptyIcon} />
        <h3>No alerts found</h3>
        <p>Adjust your filters or take a break. Your systems are secure.</p>
      </div>
    );
  }

  const getStatusClass = (status) => {
    switch(status) {
      case 'NEW': return styles.statusNew;
      case 'ACKNOWLEDGED': return styles.statusAck;
      case 'INVESTIGATING': return styles.statusInv;
      case 'RESOLVED': return styles.statusRes;
      default: return styles.statusDefault;
    }
  };

  return (
    <div className={styles.tableContainer} ref={tableRef}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Severity</th>
            <th>Title</th>
            <th>Source IP</th>
            <th>Triggered At</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert, index) => (
            <tr 
              key={alert.id} 
              ref={el => rowsRef.current[index] = el}
              className={styles.row}
              onClick={() => onRowClick(alert)}
            >
              <td>
                <SeverityBadge severity={alert.severity} />
              </td>
              <td className={styles.titleCell}>{alert.title}</td>
              <td className={styles.ipCell}>{alert.source_ip || 'N/A'}</td>
              <td className={styles.timeCell}>{formatDate(alert.triggered_at)}</td>
              <td>
                <span className={`${styles.statusBadge} ${getStatusClass(alert.status)}`}>
                  {alert.status}
                </span>
              </td>
              <td>
                <button 
                  className={styles.actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRowClick(alert);
                  }}
                  aria-label="View Details"
                >
                  <Eye size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AlertsTable;
