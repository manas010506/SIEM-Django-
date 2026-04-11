import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, AlertTriangle, X, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchAlerts } from '../../services/api';
import styles from './Toast.module.css';

const getSeverityIcon = (severity) => {
    switch (severity) {
        case 'CRITICAL': return <ShieldAlert size={18} />;
        case 'HIGH': return <AlertTriangle size={18} />;
        default: return <ShieldAlert size={18} />;
    }
};

const ToastItem = ({ toast, onDismiss }) => {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.toastId), 8000);
        return () => clearTimeout(timer);
    }, [toast.toastId, onDismiss]);

    return (
        <motion.div
            className={`${styles.toast} ${styles[toast.severity.toLowerCase()]}`}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
            <div className={styles.toastIcon}>
                {getSeverityIcon(toast.severity)}
            </div>

            <div className={styles.toastContent}>
                <div className={styles.toastHeader}>
                    <span className={styles.toastSeverity}>{toast.severity}</span>
                    <span className={styles.toastTime}>just now</span>
                </div>
                <p className={styles.toastTitle}>{toast.title}</p>
                {toast.source_ip && (
                    <p className={styles.toastIp}>Source: {toast.source_ip}</p>
                )}
            </div>

            <div className={styles.toastActions}>
                <button
                    className={styles.viewBtn}
                    onClick={() => { onDismiss(toast.toastId); navigate('/alerts'); }}
                >
                    <Eye size={14} />
                </button>
                <button
                    className={styles.dismissBtn}
                    onClick={() => onDismiss(toast.toastId)}
                >
                    <X size={14} />
                </button>
            </div>

            {/* Auto-dismiss progress bar */}
            <motion.div
                className={styles.progressBar}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 8, ease: 'linear' }}
            />
        </motion.div>
    );
};

const ToastContainer = () => {
    const [toasts, setToasts] = useState([]);
    const seenAlertIds = useRef(new Set());
    const isFirstLoad = useRef(true);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const checkNewAlerts = async () => {
            try {
                const data = await fetchAlerts({ status: 'NEW' });
                const alerts = data.results || data;

                if (isFirstLoad.current) {
                    alerts.forEach(a => seenAlertIds.current.add(a.id));
                    isFirstLoad.current = false;
                    return;
                }

                const newAlerts = alerts.filter(a => !seenAlertIds.current.has(a.id));

                newAlerts.forEach(alert => {
                    seenAlertIds.current.add(alert.id);
                    setToasts(prev => [...prev, {
                        ...alert,
                        toastId: `${alert.id}-${Date.now()}`
                    }]);
                });

            } catch (error) {
                // Silently fail - user might not be logged in
            }
        };

        checkNewAlerts();
        const interval = setInterval(checkNewAlerts, 3000);
        return () => clearInterval(interval);
    }, []);

    const dismissToast = (toastId) => {
        setToasts(prev => prev.filter(t => t.toastId !== toastId));
    };

    return (
        <div className={styles.container}>
            <AnimatePresence>
                {toasts.map(toast => (
                    <ToastItem
                        key={toast.toastId}
                        toast={toast}
                        onDismiss={dismissToast}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

export default ToastContainer;