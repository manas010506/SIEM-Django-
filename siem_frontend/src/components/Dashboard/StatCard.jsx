import React from 'react';
import { motion } from 'framer-motion';
import AnimatedCounter from '../common/AnimatedCounter';
import styles from './StatCard.module.css';

const StatCard = ({ title, value, icon: Icon, colorTheme = 'cyan', index = 0 }) => {
  return (
    <motion.div 
      className={`${styles.card} ${styles[colorTheme]}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, type: 'spring' }}
      whileHover={{ scale: 1.02, y: -5 }}
    >
      <div className={styles.iconWrapper}>
        <Icon size={24} className={styles.icon} />
      </div>
      
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.valueContainer}>
          <AnimatedCounter 
            value={value} 
            className={styles.value} 
            duration={2.5} 
          />
        </div>
      </div>
      
      <div className={styles.glowEffect}></div>
    </motion.div>
  );
};

export default StatCard;
