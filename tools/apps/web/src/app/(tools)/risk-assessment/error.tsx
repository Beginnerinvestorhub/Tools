// /data/data/com.termux/files/home/beginnerinvestorhub/tools/apps/web/src/app/(tools)/risk-assessment/error.tsx

'use client'; // Error components must be Client Components

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button'; // Assuming you have a Button component

interface ErrorProps {
  error: Error;
  reset: () => void; // Function to attempt to re-render the segment
}

export default function RiskAssessmentError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service like Sentry or LogRocket
    console.error('Risk Assessment Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16)*2)] p-4 text-center">
      <h2 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">
        Something went wrong!
      </h2>
      <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
        We encountered an issue while loading your risk assessment.
      </p>
      {/* Optional: Show specific error message in development */}
      {process.env.NODE_ENV === 'development' && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Details: {error.message}
        </p>
      )}
      <Button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
        className="px-6 py-3 text-lg font-medium bg-blue-600 hover:bg-blue-700 text-white"
      >
        Try again
      </Button>
    </div>
  );
}

