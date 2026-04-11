import React from 'react';
import { severityColor } from '../../utils/formatters';

const SeverityBadge = ({ severity }) => {
  const style = {
    backgroundColor: `${severityColor(severity)}20`, // 20% opacity using hex
    color: severityColor(severity),
    border: `1px solid ${severityColor(severity)}50`,
    padding: '0.25rem 0.6rem',
    borderRadius: '12px',
    fontSize: '0.7rem',
    fontWeight: '700',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-mono)',
    display: 'inline-flex',
    alignItems: 'center',
    boxShadow: severity === 'CRITICAL' ? `0 0 10px ${severityColor(severity)}40` : 'none',
    animation: severity === 'CRITICAL' ? 'pulse-red 2s infinite' : 'none'
  };

  return (
    <span style={style}>
      {severity}
    </span>
  );
};

export default SeverityBadge;
