import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import AnimatedCounter from '../common/AnimatedCounter';
import styles from './TopIPsBar.module.css';

gsap.registerPlugin(ScrollTrigger);

const TopIPsBar = ({ data }) => {
  const containerRef = useRef(null);
  const barsRef = useRef([]);

  useEffect(() => {
    if (containerRef.current && data && data.length > 0) {
      // Create scroll trigger batch for staggering
      ScrollTrigger.batch(barsRef.current, {
        onEnter: (elements) => {
          gsap.fromTo(
            elements,
            { opacity: 0, x: -20 },
            {
              opacity: 1,
              x: 0,
              stagger: 0.1,
              duration: 0.5,
              ease: 'power2.out',
              overwrite: true
            }
          );

          // Animate the widths of the bars
          elements.forEach((el) => {
            const fill = el.querySelector(`.${styles.barFill}`);
            if (fill) {
              const targetWidth = fill.getAttribute('data-width');
              gsap.fromTo(
                fill,
                { width: '0%' },
                { 
                  width: `${targetWidth}%`, 
                  duration: 1.5, 
                  ease: 'power3.out',
                  delay: 0.2 // Start slightly after the row fades in
                }
              );
            }
          });
        },
        start: 'top 90%',
      });
    }
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Top Source IPs</h3>
        <div className={styles.emptyState}>No IP data available</div>
      </div>
    );
  }

  // Data processing: get max for relative sizing
  const maxCount = Math.max(...data.map(d => d.count));
  
  // Show only top 5 for the dashboard widget
  const displayData = data.slice(0, 5);

  return (
    <div className={styles.container} ref={containerRef}>
      <h3 className={styles.title}>Top Source IPs</h3>
      
      <div className={styles.list}>
        {displayData.map((item, index) => {
          const widthPercent = (item.count / maxCount) * 100;
          
          return (
            <div 
              key={item.source_ip} 
              className={styles.row}
              ref={el => barsRef.current[index] = el}
            >
              <div className={styles.header}>
                <span className={styles.ip}>{item.source_ip}</span>
                <span className={styles.count}>
                  <AnimatedCounter value={item.count} duration={2} /> logs
                </span>
              </div>
              
              <div className={styles.barContainer}>
                <div 
                  className={styles.barFill} 
                  data-width={widthPercent}
                  style={{ width: '0%' }} // Initial state for GSAP
                >
                  <div className={styles.barGlow}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopIPsBar;
