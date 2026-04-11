export const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString();
};

export const formatTimeAgo = (iso) => {
    if (!iso) return '';
    const dt = new Date(iso);
    const now = new Date();
    const diff = now - dt;
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
};

export const formatNumber = (n) => {
    if (n === undefined || n === null) return '0';
    return n.toLocaleString();
};

export const truncate = (str, len = 60) => {
    if (!str) return '';
    return str.length > len ? str.slice(0, len) + '...' : str;
};

export const severityColor = (sev) => {
    const colors = {
        CRITICAL: '#ff3366',
        HIGH: '#ffb800',
        MEDIUM: '#00d4ff',
        LOW: '#00ff87'
    };
    return colors[sev] || '#8899aa';
};
