import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, Radio, Terminal, CheckCircle } from 'lucide-react';
import styles from './SimulateAttack.module.css';

const API_BASE = 'http://localhost:8000/api';

const ATTACKS = [
    {
        id: 'dos',
        label: 'DoS Attack',
        icon: Zap,
        color: '#ff4d4d',
        description: 'HTTP flood — 150 rapid requests',
        requests: 150,
        threads: 15,
        endpoint: null, // handled by middleware
    },
    {
        id: 'bruteforce',
        label: 'Brute Force',
        icon: Shield,
        color: '#ffa500',
        description: 'Simulates repeated login failures',
        requests: 10,
        threads: 1,
        endpoint: 'bruteforce', // handled by simulate endpoint
    },
    {
        id: 'portscan',
        label: 'Port Scan',
        icon: Radio,
        color: '#17a2b8',
        description: 'Sequential endpoint enumeration',
        requests: 25,
        threads: 1,
        endpoint: 'portscan', // handled by simulate endpoint
    },
];

const SimulateAttack = () => {
    const [activeAttack, setActiveAttack] = useState(null);
    const [status, setStatus] = useState('idle');
    const [log, setLog] = useState([]);
    const [requestCount, setRequestCount] = useState(0);

    const addLog = (msg, type = 'info') => {
        setLog(prev => [...prev.slice(-6), {
            msg, type, time: new Date().toLocaleTimeString()
        }]);
    };

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    const getToken = async () => {
        const res = await fetch(`${API_BASE}/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        const data = await res.json();
        return data.access;
    };

    // DoS: flood via middleware detection
    const runDoS = async (attack, token) => {
        addLog('Launching HTTP flood...', 'warning');
        const batchSize = attack.threads;
        const totalBatches = Math.ceil(attack.requests / batchSize);
        let completed = 0;

        for (let b = 0; b < totalBatches; b++) {
            const batch = Array.from({ length: batchSize }, (_, i) => {
                const reqNum = b * batchSize + i;
                if (reqNum >= attack.requests) return Promise.resolve();
                return fetch(`${API_BASE}/logs/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => { });
            });

            await Promise.all(batch);
            completed += batchSize;
            setRequestCount(Math.min(completed, attack.requests));

            if (b % 3 === 0) {
                addLog(`Sent ${Math.min(completed, attack.requests)}/${attack.requests} requests...`, 'warning');
            }
            await sleep(30);
        }
    };

    // Brute force & port scan: direct API call
    const runSimulated = async (attack, token) => {
        addLog(`Simulating ${attack.label}...`, 'warning');

        const res = await fetch(`${API_BASE}/simulate/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ attack_type: attack.endpoint })
        });

        const data = await res.json();

        if (res.ok) {
            // Animate request count
            for (let i = 1; i <= attack.requests; i++) {
                setRequestCount(i);
                await sleep(30);
            }
            addLog(`✓ ${data.message}`, 'success');
        } else {
            throw new Error(data.error || 'Simulation failed');
        }
    };

    const runAttack = async (attack) => {
        if (status === 'running') return;

        setActiveAttack(attack.id);
        setStatus('running');
        setLog([]);
        setRequestCount(0);

        try {
            addLog('Authenticating...', 'info');
            const token = await getToken();
            addLog('✓ Token obtained', 'success');

            if (attack.id === 'dos') {
                await runDoS(attack, token);
            } else {
                await runSimulated(attack, token);
            }

            addLog('⚡ Alert triggered — check dashboard!', 'success');
            setStatus('done');

            setTimeout(() => {
                setStatus('idle');
                setActiveAttack(null);
                setLog([]);
                setRequestCount(0);
            }, 5000);

        } catch (err) {
            addLog(`✗ Error: ${err.message}`, 'error');
            setStatus('error');
            setTimeout(() => {
                setStatus('idle');
                setActiveAttack(null);
            }, 3000);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Terminal size={18} className={styles.headerIcon} />
                <h3 className={styles.title}>Attack Simulator</h3>
                <span className={styles.badge}>LIVE DEMO</span>
            </div>

            <p className={styles.subtitle}>
                Simulate real attacks and watch your SIEM detect them in real-time
            </p>

            <div className={styles.attackGrid}>
                {ATTACKS.map((attack) => {
                    const Icon = attack.icon;
                    const isActive = activeAttack === attack.id && status === 'running';
                    const isDone = activeAttack === attack.id && status === 'done';

                    return (
                        <motion.button
                            key={attack.id}
                            className={`${styles.attackBtn} ${isActive ? styles.running : ''} ${isDone ? styles.done : ''}`}
                            style={{ '--attack-color': attack.color }}
                            onClick={() => runAttack(attack)}
                            disabled={status === 'running'}
                            whileHover={{ scale: status === 'running' ? 1 : 1.02 }}
                            whileTap={{ scale: status === 'running' ? 1 : 0.98 }}
                        >
                            <div className={styles.btnTop}>
                                {isDone
                                    ? <CheckCircle size={20} style={{ color: '#00ff87' }} />
                                    : <Icon size={20} style={{ color: attack.color }} />
                                }
                                <span className={styles.btnLabel}>{attack.label}</span>
                                {isActive && (
                                    <motion.div
                                        className={styles.pulseRing}
                                        animate={{ scale: [1, 1.8], opacity: [0.8, 0] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                        style={{ background: attack.color }}
                                    />
                                )}
                            </div>
                            <p className={styles.btnDesc}>{attack.description}</p>
                            {isActive && (
                                <motion.div
                                    className={styles.progressBar}
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${(requestCount / attack.requests) * 100}%` }}
                                    style={{ background: attack.color }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            <AnimatePresence>
                {log.length > 0 && (
                    <motion.div
                        className={styles.terminal}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <div className={styles.terminalHeader}>
                            <span className={styles.terminalDot} style={{ background: '#ff4d4d' }} />
                            <span className={styles.terminalDot} style={{ background: '#ffa500' }} />
                            <span className={styles.terminalDot} style={{ background: '#00ff87' }} />
                            <span className={styles.terminalTitle}>siem@attack-simulator ~ </span>
                        </div>
                        <div className={styles.terminalBody}>
                            {log.map((entry, i) => (
                                <motion.div
                                    key={i}
                                    className={`${styles.logLine} ${styles[entry.type]}`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    <span className={styles.logTime}>{entry.time}</span>
                                    <span>{entry.msg}</span>
                                </motion.div>
                            ))}
                            {status === 'running' && (
                                <motion.div
                                    className={styles.cursor}
                                    animate={{ opacity: [1, 0] }}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                >█</motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SimulateAttack;