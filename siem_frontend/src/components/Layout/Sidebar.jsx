import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShieldAlert, FileText, User, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { fetchAlerts } from '../../services/api';
import styles from './Sidebar.module.css';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/alerts', label: 'Alerts', icon: ShieldAlert, badge: true },
  { path: '/logs', label: 'Logs', icon: FileText },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [activeAlertCount, setActiveAlertCount] = useState(0);

  useEffect(() => {
    loadAlertCount();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadAlertCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAlertCount = async () => {
    try {
      const data = await fetchAlerts({ status: 'NEW' });
      const alerts = data.results || data;
      setActiveAlertCount(alerts.length);
    } catch (error) {
      console.error('Failed to load alert count:', error);
    }
  };

  return (
    <motion.aside
      className={styles.sidebar}
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      <div className={styles.logoSection}>
        <div className={styles.iconWrapper}>
          <ShieldAlert className={styles.logoIcon} size={28} />
        </div>
        <div className={styles.logoText}>
          <h2>SIEM</h2>
          <span>Security Monitor</span>
        </div>
      </div>

      <nav className={styles.navigation}>
        <ul>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div
                          layoutId="activeBorder"
                          className={styles.activeBorder}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <Icon size={20} className={styles.navIcon} />
                      <span className={styles.navLabel}>{item.label}</span>
                      {/* ✅ FIXED - now dynamic */}
                      {item.badge && activeAlertCount > 0 && (
                        <span className={styles.badge}>{activeAlertCount}</span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.bottomSection}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            <User size={20} />
          </div>
          <div className={styles.userDetails}>
            <span className={styles.username}>{user?.username || 'Analyst'}</span>
            <span className={styles.role}>{user?.role || 'Admin'}</span>
          </div>
        </div>

        <button className={styles.logoutBtn} onClick={logout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;