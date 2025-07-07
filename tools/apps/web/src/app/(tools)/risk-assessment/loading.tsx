// /data/data/com.termux/files/home/beginnerinvestorhub/tools/apps/web/src/app/(tools)/risk-assessment/loading.tsx

import React from 'react';

export default function RiskAssessmentLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16)*2)] p-4">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
        Loading risk assessment...
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        Please wait while we prepare your personalized risk profile.
      </p>
    </div>
  );
}

