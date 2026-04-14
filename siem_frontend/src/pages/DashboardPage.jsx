import React, { useEffect } from 'react';
import { Database, ShieldAlert, Zap, Activity } from 'lucide-react';
import { initScrollTriggerRefresh } from '../main';
import useDashboardStats from '../hooks/useDashboardStats';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorBoundary from '../components/common/ErrorBoundary';
import StatCard from '../components/Dashboard/StatCard';
import LogsChart from '../components/Dashboard/LogsChart';
import SeverityPieChart from '../components/Dashboard/SeverityPieChart';
import TopIPsBar from '../components/Dashboard/TopIPsBar';
import RecentAlerts from '../components/Dashboard/RecentAlerts';
import SimulateAttack from '../components/Dashboard/SimulateAttack'; // ← ADD
import styles from './DashboardPage.module.css';
import BlockedIPs from '../components/Dashboard/BlockedIPs';
import MitigationPanel from '../components/Dashboard/MitigationPanel';

const DashboardContent = () => {
  const { stats, isLoading, error } = useDashboardStats();

  useEffect(() => {
    if (!isLoading && stats) {
      setTimeout(() => initScrollTriggerRefresh(), 100);
    }
  }, [isLoading, stats]);

  if (isLoading && !stats) {
    return <LoadingSpinner text="Aggregating telemetry data..." />;
  }

  if (error) {
    throw new Error(error);
  }

  if (!stats) return null;

  return (
    <div className={styles.dashboardContainer}>
      {/* Top Row: Stat Cards */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Total Logs Processed"
          value={stats.total_logs}
          icon={Database}
          colorTheme="cyan"
          index={0}
        />
        <StatCard
          title="Active Alerts"
          value={stats.active_alerts}
          icon={ShieldAlert}
          colorTheme="amber"
          index={1}
        />
        <StatCard
          title="Critical Alerts"
          value={stats.critical_alerts}
          icon={Zap}
          colorTheme="red"
          index={2}
        />
        <StatCard
          title="Logs (Last 24h)"
          value={stats.logs_last_24h}
          icon={Activity}
          colorTheme="green"
          index={3}
        />
      </div>

      {/* Middle Row: Charts */}
      <div className={styles.chartsGrid}>
        <div className={styles.chartWide}>
          <LogsChart data={stats.logs_over_time} />
        </div>
        <div className={styles.chartNarrow}>
          <SeverityPieChart data={stats.alert_severity_distribution} />
        </div>
      </div>

      {/* Attack Simulator ← ADD THIS */}
      <SimulateAttack />
      <MitigationPanel />
      <BlockedIPs />

      {/* Bottom Row: Lists & Bars */}
      <div className={styles.bottomGrid}>
        <div className={styles.halfWidth}>
          <TopIPsBar data={stats.top_source_ips} />
        </div>
        <div className={styles.halfWidth}>
          <RecentAlerts alerts={stats.recent_alerts} />
        </div>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
};

export default DashboardPage;
// ```

// ---

// **What judges will see:**
// ```
// Click "DoS Attack" button
//         ↓
// Button pulses red with animation
//         ↓
// Terminal shows live logs:
//   "Authenticating..."
//   "✓ Token obtained"
//   "Launching DoS Attack..."
//   "Sent 75/150 requests..."
//   "✓ 150 requests sent!"
//   "⚡ Check alerts!"
//         ↓
// Toast popup appears 🚨
//         ↓
// Alert count on dashboard updates
//         ↓
// Judge is thoroughly impressed 🏆