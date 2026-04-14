import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SeverityBadge from './SeverityBadge';
import { formatDate } from '../../utils/formatters';
import styles from './AlertsTable.module.css';
import { Shield, Eye, ShieldOff } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// ── Threat Score Meter ────────────────────────────────────────────────────────
const ThreatScoreMeter = ({ score = 0 }) => {
  const getColor = (s) => {
    if (s >= 80) return '#ff4d4d';
    if (s >= 60) return '#ffa500';
    if (s >= 40) return '#ffd166';
    return '#00ff87';
  };

  const getLabel = (s) => {
    if (s >= 80) return 'CRITICAL';
    if (s >= 60) return 'HIGH';
    if (s >= 40) return 'MEDIUM';
    return 'LOW';
  };

  const color = getColor(score);

  return (
    <div className={styles.threatMeter}>
      <div className={styles.threatBarWrapper}>
        <div
          className={styles.threatBar}
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <div className={styles.threatInfo}>
        <span className={styles.threatScore} style={{ color }}>
          {score}
        </span>
        <span className={styles.threatLabel} style={{ color }}>
          {getLabel(score)}
        </span>
      </div>
    </div>
  );
};

// ── Mitigation Badge ──────────────────────────────────────────────────────────
const MitigationBadge = ({ details }) => {
  if (!details?.mitigation_applied) {
    return (
      <span className={styles.mitigationNone}>
        No mitigation
      </span>
    );
  }

  const typeMap = {
    'IP_BLOCK': '🛡️ IP Blocked',
    'ACCOUNT_LOCKOUT': '🔒 Account Locked',
    'IP_BLACKLIST': '🚫 Blacklisted',
    'RATE_LIMIT': '⚡ Rate Limited',
  };

  const label = typeMap[details.mitigation_type]
    || `🛡️ ${details.mitigation_type?.replace('_', ' ') || 'Mitigated'}`;

  return (
    <span className={styles.mitigationActive}>
      {label}
    </span>
  );
};

const AlertsTable = ({ alerts, onRowClick }) => {
  const tableRef = useRef(null);
  const rowsRef = useRef([]);

  useEffect(() => {
    if (tableRef.current && alerts && alerts.length > 0) {
      ScrollTrigger.getAll().forEach(t => {
        if (
          t.vars.trigger === tableRef.current ||
          rowsRef.current.includes(t.vars.trigger)
        ) {
          t.kill();
        }
      });

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

  const handleBlockIP = async (e, ip) => {
    e.stopPropagation();
    if (!ip || ip === 'N/A') return;

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/api/block-ip/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ip_address: ip,
          reason: 'Manually blocked by analyst'
        })
      });
      if (res.ok) {
        alert(`✅ IP ${ip} has been blocked!`);
      }
    } catch (err) {
      console.error('Block failed:', err);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'NEW':           return styles.statusNew;
      case 'ACKNOWLEDGED':  return styles.statusAck;
      case 'INVESTIGATING': return styles.statusInv;
      case 'RESOLVED':      return styles.statusRes;
      default:              return styles.statusDefault;
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
            <th>Threat Score</th>
            <th>Mitigation</th>  {/* ✅ NEW column */}
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
              <td className={styles.scoreCell}>
                <ThreatScoreMeter score={alert.threat_score || 0} />
              </td>
              {/* ✅ NEW — Mitigation badge */}
              <td className={styles.mitigationCell}>
                <MitigationBadge details={alert.details} />
              </td>
              <td className={styles.timeCell}>{formatDate(alert.triggered_at)}</td>
              <td>
                <span className={`${styles.statusBadge} ${getStatusClass(alert.status)}`}>
                  {alert.status}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className={styles.actionBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRowClick(alert);
                    }}
                    aria-label="View Details"
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className={styles.blockBtn}
                    onClick={(e) => handleBlockIP(e, alert.source_ip)}
                    aria-label="Block IP"
                    title={`Block ${alert.source_ip}`}
                    disabled={!alert.source_ip || alert.source_ip === 'N/A'}
                  >
                    <ShieldOff size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AlertsTable;