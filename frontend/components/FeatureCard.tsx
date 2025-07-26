import React from 'react';
import { cloneElement, isValidElement } from 'react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  const sizedIcon = isValidElement(icon)
    ? cloneElement(icon, {
        className: 'w-6 h-6 text-indigo-700',
      })
    : icon;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-sm flex flex-col items-center text-center hover:shadow-lg transition duration-200">
      <div className="mb-4 bg-indigo-100 p-4 rounded-full flex items-center justify-center">
        {sizedIcon}
      </div>
      <h3 className="text-lg font-semibold text-indigo-800 mb-2">{title}</h3>
      <p className="text-sm text-indigo-600">{description}</p>
    </div>
  );
}
