import React from 'react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center bg-white rounded-xl shadow-md p-6 m-2 w-full md:w-64 hover:shadow-lg transition-shadow">
      <div className="text-indigo-600 text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2 text-indigo-800">{title}</h3>
      <p className="text-gray-600 text-center">{description}</p>
    </div>
  );
}
