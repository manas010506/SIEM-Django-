import React, { useState, useEffect } from 'react';
import { ShieldOff, ShieldCheck } from 'lucide-react';
import styles from './BlockedIPs.module.css';

const BlockedIPs = () => {
    const [blockedIPs, setBlockedIPs] = useState([]);

    useEffect(() => {
        loadBlockedIPs();
        const interval = setInterval(loadBlockedIPs, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadBlockedIPs = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch('http://localhost:8000/api/blocked-ips/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setBlockedIPs(data);
        } catch (err) {
            console.error('Failed to load blocked IPs:', err);
        }
    };

    const handleUnblock = async (ip) => {
        try {
            const token = localStorage.getItem('access_token');
            await fetch('http://localhost:8000/api/unblock-ip/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ip_address: ip })
            });
            loadBlockedIPs();
        } catch (err) {
            console.error('Unblock failed:', err);
        }
    };

    const handleUnblockAll = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const promises = blockedIPs.map(item =>
                fetch('http://localhost:8000/api/unblock-ip/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ ip_address: item.ip_address })
                })
            );
            await Promise.all(promises);
            loadBlockedIPs();
            console.log('All IPs unblocked!');
        } catch (err) {
            console.error('Unblock all failed:', err);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <ShieldOff size={18} className={styles.icon} />
                <h3 className={styles.title}>Blocked IPs</h3>
                <span className={styles.count}>{blockedIPs.length} Active</span>
                {blockedIPs.length > 0 && (
                    <button
                        className={styles.unblockAllBtn}
                        onClick={handleUnblockAll}
                    >
                        Reset All
                    </button>
                )}
            </div>

            {blockedIPs.length === 0 ? (
                <div className={styles.empty}>
                    <ShieldCheck size={24} color="#00ff87" />
                    <span>No IPs currently blocked</span>
                </div>
            ) : (
                <div className={styles.list}>
                    {blockedIPs.map((item, i) => (
                        <div key={i} className={styles.item}>
                            <div className={styles.itemInfo}>
                                <span className={styles.ip}>{item.ip_address}</span>
                                <span className={styles.reason}>{item.reason}</span>
                                <span className={styles.by}>
                                    {item.blocked_by === 'AUTO' ? '🤖 Auto-blocked' : '👤 Manual'}
                                </span>
                            </div>
                            <button
                                className={styles.unblockBtn}
                                onClick={() => handleUnblock(item.ip_address)}
                                title="Unblock IP"
                            >
                                <ShieldCheck size={14} />
                                Unblock
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BlockedIPs;