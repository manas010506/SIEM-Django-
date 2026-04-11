import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, ShieldAlert, AlertTriangle, Info } from 'lucide-react';
import { fetchAlerts } from '../../services/api';
import styles from './Navbar.module.css';

const getPageTitle = (pathname) => {
  if (pathname.includes('/dashboard')) return 'Dashboard Overview';
  if (pathname.includes('/alerts')) return 'Security Alerts';
  if (pathname.includes('/logs')) return 'System Logs';
  return 'SIEM Platform';
};

const getSeverityIcon = (severity) => {
  switch (severity) {
    case 'CRITICAL': return <ShieldAlert size={14} color="#ff4d4d" />;
    case 'HIGH':     return <AlertTriangle size={14} color="#ffa500" />;
    default:         return <Info size={14} color="#17a2b8" />;
  }
};

const getSeverityColor = (severity) => {
  switch (severity) {
    case 'CRITICAL': return '#ff4d4d';
    case 'HIGH':     return '#ffa500';
    case 'MEDIUM':   return '#17a2b8';
    default:         return '#28a745';
  }
};

const timeAgo = (dateStr) => {
  const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = getPageTitle(location.pathname);

  const [showDropdown, setShowDropdown] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await fetchAlerts({ status: 'NEW' });
      const alertList = data.results || data;
      setAlerts(alertList.slice(0, 5)); // Show latest 5
      setUnreadCount(alertList.length);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleViewAll = () => {
    setShowDropdown(false);
    navigate('/alerts');
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.leftSection}>
        <h1 className={styles.pageTitle}>{pageTitle}</h1>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.searchContainer}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search logs, IPs, or alert IDs..."
            className={styles.searchInput}
          />
        </div>

        <div className={styles.statusIndicator}>
          <div className={styles.pulseDot}></div>
          <span className={styles.statusText}>System Online</span>
        </div>

        {/* Bell with dropdown */}
        <div className={styles.notificationWrapper} ref={dropdownRef}>
          <button
            className={styles.iconButton}
            aria-label="Notifications"
            onClick={handleBellClick}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className={styles.notificationBadge}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <span className={styles.dropdownTitle}>🔔 Active Alerts</span>
                <span className={styles.dropdownCount}>{unreadCount} NEW</span>
              </div>

              <div className={styles.dropdownList}>
                {alerts.length === 0 ? (
                  <div className={styles.noAlerts}>
                    <ShieldAlert size={24} />
                    <span>No active alerts</span>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={styles.dropdownItem}
                      onClick={handleViewAll}
                    >
                      <div className={styles.alertIcon}>
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div className={styles.alertInfo}>
                        <span className={styles.alertTitle}>{alert.title}</span>
                        <div className={styles.alertMeta}>
                          <span
                            className={styles.alertSeverity}
                            style={{ color: getSeverityColor(alert.severity) }}
                          >
                            {alert.severity}
                          </span>
                          <span className={styles.alertTime}>
                            {timeAgo(alert.triggered_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button className={styles.viewAllBtn} onClick={handleViewAll}>
                View All Alerts →
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;