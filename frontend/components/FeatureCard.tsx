// /data/data/com.termux/files/home/beginnerinvestorhub/tools/apps/web/src/components/FeatureCard.tsx

import React from 'react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-sm flex flex-col items-center text-center hover:shadow-lg transition duration-200">
      <div className="mb-4 bg-indigo-100 p-4 rounded-full flex items-center justify-center">
        {/*
          This div now consistently sizes the icon to w-8 h-8.
          When passing icons (e.g., Heroicons) to this prop,
          you should NOT apply w-* h-* classes to the icon itself in the parent component (e.g., page.tsx).
          Just pass the icon, and let this wrapper manage its size.
        */}
        <div className="w-6 h-6 text-indigo-700">{icon}</div>
      </div>
      <h3 className="text-lg font-semibold text-indigo-800 mb-2">{title}</h3>
      <p className="text-sm text-indigo-600">{description}</p>
    </div>
  );
}
