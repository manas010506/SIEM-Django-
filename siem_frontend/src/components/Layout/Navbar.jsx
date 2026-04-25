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
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const LiveClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const date = time.toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
  const clock = time.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  return (
    <div className={styles.liveClock}>
      <span className={styles.clockDate}>{date}</span>
      <span className={styles.clockTime}>{clock}</span>
    </div>
  );
};

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = getPageTitle(location.pathname);

  const [showDropdown, setShowDropdown] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await fetchAlerts({ status: 'NEW' });
      const alertList = data.results || data;
      setAlerts(alertList.slice(0, 5));
      // ✅ Use total count from API pagination
      setUnreadCount(data.count || alertList.length);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const alertData = await fetchAlerts({ search: query });
      const alertList = (alertData.results || alertData).slice(0, 3);

      const results = [
        ...alertList.map(a => ({
          type: 'alert',
          id: a.id,
          title: a.title,
          subtitle: `${a.severity} • ${a.source_ip || 'N/A'}`,
          color: getSeverityColor(a.severity),
          action: () => navigate('/alerts')
        })),
      ];

      const ipPattern = /^\d{1,3}\.\d{1,3}/;
      if (ipPattern.test(query)) {
        results.push({
          type: 'ip',
          title: `Search logs for IP: ${query}`,
          subtitle: 'Click to filter logs by this IP',
          color: '#00d4ff',
          action: () => navigate(`/logs?source_ip=${query}`)
        });
      }

      setSearchResults(results);
      setShowSearchResults(true);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setShowSearchResults(false);
      const ipPattern = /^\d{1,3}\.\d{1,3}/;
      if (ipPattern.test(searchQuery)) {
        navigate(`/logs?source_ip=${searchQuery}`);
      } else {
        navigate(`/alerts?search=${searchQuery}`);
      }
      setSearchQuery('');
    }
    if (e.key === 'Escape') {
      setShowSearchResults(false);
      setSearchQuery('');
    }
  };

  const handleResultClick = (result) => {
    result.action();
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const handleBellClick = () => setShowDropdown(!showDropdown);

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

        {/* Search Bar */}
        <div className={styles.searchWrapper} ref={searchRef}>
          <div className={styles.searchContainer}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search IPs, alerts..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
            />
            {searchQuery && (
              <button
                className={styles.searchClear}
                onClick={() => { setSearchQuery(''); setShowSearchResults(false); }}
              >
                ×
              </button>
            )}
          </div>

          {showSearchResults && searchResults.length > 0 && (
            <div className={styles.searchDropdown}>
              {searchResults.map((result, i) => (
                <div
                  key={i}
                  className={styles.searchResult}
                  onClick={() => handleResultClick(result)}
                >
                  <div
                    className={styles.searchResultDot}
                    style={{ background: result.color }}
                  />
                  <div className={styles.searchResultInfo}>
                    <span className={styles.searchResultTitle}>{result.title}</span>
                    <span className={styles.searchResultSub}>{result.subtitle}</span>
                  </div>
                </div>
              ))}
              <div className={styles.searchHint}>
                Press Enter to search • ESC to close
              </div>
            </div>
          )}
        </div>

        {/* Live Clock */}
        <LiveClock />

        {/* Status Indicator */}
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