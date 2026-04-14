import React, { useState, useEffect } from 'react';
import { ShieldOff, ShieldCheck, RefreshCw, Lock, AlertTriangle } from 'lucide-react';
import styles from './MitigationPanel.module.css';

const API_BASE = 'http://localhost:8000/api';

const MitigationPanel = () => {
    const [status, setStatus] = useState({
        blocked_ips: [],
        blacklisted_ips: [],
        locked_accounts: []
    });
    const [manualIp, setManualIp] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadStatus();
        const interval = setInterval(loadStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const getToken = () => localStorage.getItem('access_token');

    const loadStatus = async () => {
        try {
            const res = await fetch(`${API_BASE}/mitigation-status/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await res.json();
            setStatus(data);
        } catch (err) {
            console.error('Failed to load mitigation status:', err);
        }
    };

    const handleManualBlock = async () => {
        if (!manualIp.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/block-ip/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({
                    ip_address: manualIp,
                    reason: 'Manually blocked by analyst'
                })
            });
            if (res.ok) {
                setManualIp('');
                loadStatus();
            }
        } catch (err) {
            console.error('Block failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUnblock = async (ip) => {
        try {
            await fetch(`${API_BASE}/unblock-ip/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ ip_address: ip })
            });
            loadStatus();
        } catch (err) {
            console.error('Unblock failed:', err);
        }
    };

    // ✅ NEW — Unlock a locked account
    const handleUnlockAccount = async (username) => {
        try {
            const res = await fetch(`${API_BASE}/unlock-account/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ username })
            });
            if (res.ok) loadStatus();
        } catch (err) {
            console.error('Unlock failed:', err);
        }
    };

    // ✅ UPDATED — Now also unlocks all accounts
    const handleUnblockAll = async () => {
        const allIps = [
            ...status.blocked_ips.map(b => b.ip),
            ...status.blacklisted_ips.map(b => b.ip)
        ];
        await Promise.all(allIps.map(ip => handleUnblock(ip)));

        // ✅ Also unlock all locked accounts
        await Promise.all(
            status.locked_accounts.map(a => handleUnlockAccount(a.username))
        );

        loadStatus();
    };

    const formatExpiry = (seconds) => {
        if (seconds <= 0) return 'Expired';
        if (seconds < 60) return `${seconds}s`;
        return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    };

    const totalActive =
        status.blocked_ips.length +
        status.blacklisted_ips.length +
        status.locked_accounts.length;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <ShieldOff size={18} className={styles.headerIcon} />
                <h3 className={styles.title}>Active Mitigations</h3>
                <span className={styles.totalBadge}>{totalActive} Active</span>
                <button className={styles.refreshBtn} onClick={loadStatus}>
                    <RefreshCw size={14} />
                </button>
                {totalActive > 0 && (
                    <button className={styles.resetAllBtn} onClick={handleUnblockAll}>
                        Reset All
                    </button>
                )}
            </div>

            {/* Stats Row */}
            <div className={styles.statsRow}>
                <div className={styles.statBox} style={{ borderColor: '#ff4d4d' }}>
                    <span className={styles.statNum} style={{ color: '#ff4d4d' }}>
                        {status.blocked_ips.length}
                    </span>
                    <span className={styles.statLabel}>DoS Blocked</span>
                </div>
                <div className={styles.statBox} style={{ borderColor: '#ffa500' }}>
                    <span className={styles.statNum} style={{ color: '#ffa500' }}>
                        {status.blacklisted_ips.length}
                    </span>
                    <span className={styles.statLabel}>Blacklisted</span>
                </div>
                <div className={styles.statBox} style={{ borderColor: '#17a2b8' }}>
                    <span className={styles.statNum} style={{ color: '#17a2b8' }}>
                        {status.locked_accounts.length}
                    </span>
                    <span className={styles.statLabel}>Locked Accounts</span>
                </div>
            </div>

            {/* Blocked IPs Section */}
            {status.blocked_ips.length > 0 && (
                <div className={styles.section}>
                    <p className={styles.sectionTitle}>
                        <ShieldOff size={12} /> DoS Blocked IPs
                    </p>
                    {status.blocked_ips.map((item, i) => (
                        <div key={i} className={styles.listItem}>
                            <div className={styles.itemLeft}>
                                <span className={styles.ip}>{item.ip}</span>
                                <span className={styles.badge} style={{
                                    background: 'rgba(255,77,77,0.15)',
                                    color: '#ff4d4d'
                                }}>
                                    DoS Block
                                </span>
                                <span className={styles.expiry}>
                                    ⏱ {formatExpiry(item.expires_in)}
                                </span>
                            </div>
                            <button
                                className={styles.releaseBtn}
                                onClick={() => handleUnblock(item.ip)}
                            >
                                <ShieldCheck size={12} /> Release
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Blacklisted IPs Section */}
            {status.blacklisted_ips.length > 0 && (
                <div className={styles.section}>
                    <p className={styles.sectionTitle}>
                        <AlertTriangle size={12} /> Port Scan Blacklist
                    </p>
                    {status.blacklisted_ips.map((item, i) => (
                        <div key={i} className={styles.listItem}>
                            <div className={styles.itemLeft}>
                                <span className={styles.ip}>{item.ip}</span>
                                <span className={styles.badge} style={{
                                    background: 'rgba(255,165,0,0.15)',
                                    color: '#ffa500'
                                }}>
                                    Blacklisted
                                </span>
                                <span className={styles.expiry}>
                                    ⏱ {formatExpiry(item.expires_in)}
                                </span>
                            </div>
                            <button
                                className={styles.releaseBtn}
                                onClick={() => handleUnblock(item.ip)}
                            >
                                <ShieldCheck size={12} /> Release
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* ✅ UPDATED — Locked Accounts Section now has Unlock button */}
            {status.locked_accounts.length > 0 && (
                <div className={styles.section}>
                    <p className={styles.sectionTitle}>
                        <Lock size={12} /> Locked Accounts
                    </p>
                    {status.locked_accounts.map((item, i) => (
                        <div key={i} className={styles.listItem}>
                            <div className={styles.itemLeft}>
                                <span className={styles.ip}>{item.username}</span>
                                <span className={styles.badge} style={{
                                    background: 'rgba(23,162,184,0.15)',
                                    color: '#17a2b8'
                                }}>
                                    Locked
                                </span>
                                <span className={styles.expiry}>
                                    ⏱ {formatExpiry(item.expires_in)}
                                </span>
                            </div>
                            {/* ✅ NEW — Unlock button */}
                            <button
                                className={styles.releaseBtn}
                                onClick={() => handleUnlockAccount(item.username)}
                            >
                                <ShieldCheck size={12} /> Unlock
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {totalActive === 0 && (
                <div className={styles.emptyState}>
                    <ShieldCheck size={28} color="#00ff87" />
                    <span>No active mitigations</span>
                    <span className={styles.emptySubtext}>
                        System will auto-block attackers when detected
                    </span>
                </div>
            )}

            {/* Manual Block Input */}
            <div className={styles.manualBlock}>
                <input
                    type="text"
                    placeholder="Enter IP to manually block..."
                    value={manualIp}
                    onChange={(e) => setManualIp(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualBlock()}
                    className={styles.input}
                />
                <button
                    className={styles.blockBtn}
                    onClick={handleManualBlock}
                    disabled={loading || !manualIp.trim()}
                >
                    <ShieldOff size={14} />
                    {loading ? 'Blocking...' : 'Block IP'}
                </button>
            </div>
        </div>
    );
};

export default MitigationPanel;