import * as React from 'react';

export const Button: React.FC<React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>> = ({ children, ...props }) => {
  return (
    <button {...props} style={{ padding: '0.5rem 1rem', background: '#4ECDC4', color: '#fff', border: 'none', borderRadius: 4 }}>
      {children}
    </button>
  );
};