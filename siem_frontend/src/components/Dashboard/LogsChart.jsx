import React, { useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './Charts.module.css';

gsap.registerPlugin(ScrollTrigger);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.customTooltip}>
        <p className={styles.tooltipLabel}>{label}</p>
        <p className={styles.tooltipValue}>
          <span className={styles.tooltipIndicator} style={{ backgroundColor: payload[0].color }}></span>
          {`${payload[0].value.toLocaleString()} logs`}
        </p>
      </div>
    );
  }
  return null;
};

const LogsChart = ({ data }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      gsap.fromTo(
        chartRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: chartRef.current,
            start: 'top 80%',
          }
        }
      );
    }
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className={styles.chartContainer} ref={chartRef}>
        <h3 className={styles.chartTitle}>Logs Over Time (7 Days)</h3>
        <div className={styles.emptyState}>No log data available</div>
      </div>
    );
  }

  // Format data for display
  const formattedData = data.map(item => ({
    ...item,
    displayDate: new Date(item.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }));

  return (
    <div className={styles.chartContainer} ref={chartRef}>
      <h3 className={styles.chartTitle}>Logs Over Time (7 Days)</h3>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={formattedData}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false} />
            <XAxis 
              dataKey="displayDate" 
              stroke="#8899aa" 
              tick={{ fill: '#8899aa', fontSize: 12, fontFamily: 'DM Sans' }}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#8899aa" 
              tick={{ fill: '#8899aa', fontSize: 12, fontFamily: 'DM Sans' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value > 1000 ? `${(value/1000).toFixed(1)}k` : value}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0, 212, 255, 0.2)', strokeWidth: 2 }} />
            <Area type="monotone" dataKey="count" stroke="none" fillOpacity={1} fill="url(#colorCount)" />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="#00d4ff" 
              strokeWidth={3}
              dot={{ r: 4, fill: '#0a0f1e', stroke: '#00d4ff', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#00d4ff', stroke: '#fff', strokeWidth: 2 }}
              animationDuration={1500}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LogsChart;
