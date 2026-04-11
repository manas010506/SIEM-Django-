import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { severityColor } from '../../utils/formatters';
import styles from './RecentAlerts.module.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring' } }
};

const StatusBadge = ({ status }) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'NEW': return styles.statusNew;
      case 'ACKNOWLEDGED': return styles.statusAck;
      case 'INVESTIGATING': return styles.statusInv;
      case 'RESOLVED': return styles.statusRes;
      default: return styles.statusDefault;
    }
  };

  return (
    <span className={`${styles.statusBadge} ${getStatusStyle()}`}>
      {status}
    </span>
  );
};

const RecentAlerts = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Recent Alerts</h3>
        <div className={styles.emptyState}>No recent alerts to display</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Recent Alerts</h3>
      
      <motion.div 
        className={styles.list}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {alerts.map((alert) => (
          <motion.div key={alert.id} className={styles.alertItem} variants={itemVariants}>
            <div 
              className={styles.severityDot} 
              style={{ 
                backgroundColor: severityColor(alert.severity),
                boxShadow: `0 0 10px ${severityColor(alert.severity)}` 
              }}
            ></div>
            
            <div className={styles.alertContent}>
              <div className={styles.alertHeader}>
                <h4 className={styles.alertTitle}>{alert.title}</h4>
                <span className={styles.timeAgo}>{alert.time_ago}</span>
              </div>
              
              <div className={styles.alertFooter}>
                <StatusBadge status={alert.status} />
                <span className={styles.alertId}>#ALT-{alert.id}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
      
      <Link to="/alerts" className={styles.viewAllBtn}>
        <span>View All Alerts</span>
        <ArrowRight size={16} />
      </Link>
    </div>
  );
};

export default RecentAlerts;
