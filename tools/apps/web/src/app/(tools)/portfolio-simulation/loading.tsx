// /data/data/com.termux/files/home/beginnerinvestorhub/tools/apps/web/src/app/(tools)/portfolio-simulation/loading.tsx

import React from 'react';

export default function PortfolioSimulationLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16)*2)] p-4">
      <div className="animate-pulse flex flex-col items-center space-y-4">
        <div className="w-24 h-24 bg-blue-200 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        </div>
        <p className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-300">
          Running simulations...
        </p>
        <p className="text-md text-gray-500 dark:text-gray-400 mt-2 text-center max-w-sm">
          Please wait while we generate your portfolio projections and analyze market scenarios.
        </p>
        <div className="w-64 h-4 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="w-48 h-4 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
}

