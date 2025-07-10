import React from 'react';

interface ResponsiveContainerProps {
  children: React.ReactNode;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({ children }) => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
    {children}
  </div>
);
