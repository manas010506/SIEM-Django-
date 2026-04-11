import React from 'react';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ text = 'Initializing System...', fullScreen = false }) => {
  const containerClass = fullScreen ? styles.fullScreen : styles.container;

  return (
    <div className={containerClass}>
      <div className={styles.scannerContainer}>
        <div className={styles.shield}>
          <div className={styles.shieldInner}></div>
        </div>
        <div className={styles.scanLine}></div>
      </div>
      <div className={styles.textWrapper}>
        <span className={styles.text}>{text}</span>
        <span className={styles.dots}></span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
