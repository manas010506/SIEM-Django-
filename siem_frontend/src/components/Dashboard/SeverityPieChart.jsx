import React, { useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { severityColor } from '../../utils/formatters';
import styles from './Charts.module.css';

gsap.registerPlugin(ScrollTrigger);

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className={styles.customTooltip}>
        <p className={styles.tooltipLabel}>Severity</p>
        <p className={styles.tooltipValue}>
          <span 
            className={styles.tooltipIndicator} 
            style={{ backgroundColor: severityColor(data.severity) }}
          ></span>
          {data.severity}: {data.count}
        </p>
      </div>
    );
  }
  return null;
};

const SeverityPieChart = ({ data }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      gsap.fromTo(
        chartRef.current,
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: chartRef.current,
            start: 'top 85%',
          }
        }
      );
    }
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className={styles.chartContainer} ref={chartRef}>
        <h3 className={styles.chartTitle}>Alert Distribution</h3>
        <div className={styles.emptyState}>No alert data available</div>
      </div>
    );
  }

  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className={styles.chartContainer} ref={chartRef}>
      <h3 className={styles.chartTitle}>Alert Distribution</h3>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="80%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="65%"
              outerRadius="90%"
              paddingAngle={4}
              dataKey="count"
              stroke="none"
              animationBegin={200}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={severityColor(entry.severity)} 
                  style={{ filter: `drop-shadow(0 0 6px ${severityColor(entry.severity)}80)` }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        
        <div className={styles.legendContainer}>
          {data.map((entry, index) => {
            const percentage = ((entry.count / total) * 100).toFixed(0);
            return (
              <div key={`legend-${index}`} className={styles.legendItem}>
                <div 
                  className={styles.legendColor} 
                  style={{ backgroundColor: severityColor(entry.severity) }}
                ></div>
                <div className={styles.legendLabel}>
                  {entry.severity} <span className={styles.legendValue}>{percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SeverityPieChart;
