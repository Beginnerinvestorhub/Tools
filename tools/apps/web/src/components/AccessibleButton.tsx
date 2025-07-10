import React from 'react';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({ label, ...props }) => (
  <button
    {...props}
    className={
      'px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ' +
      (props.className || '')
    }
    aria-label={label}
  >
    {props.children}
  </button>
);
