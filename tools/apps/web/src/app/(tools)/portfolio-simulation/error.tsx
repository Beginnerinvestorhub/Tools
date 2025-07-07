// /data/data/com.termux/files/home/beginnerinvestorhub/tools/apps/web/src/app/(tools)/portfolio-simulation/error.tsx

'use client'; // Error components must be Client Components

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button'; // Assuming you have a Button component

interface ErrorProps {
  error: Error;
  reset: () => void; // Function to attempt to re-render the segment
}

export default function PortfolioSimulationError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Portfolio Simulation Error:', error);
    // e.g., Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16)*2)] p-4 text-center">
      <h2 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">
        Simulation Failed!
      </h2>
      <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
        We could not run your portfolio simulation at this time.
      </p>
      {process.env.NODE_ENV === 'development' && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Error details: {error.message}
        </p>
      )}
      <Button
        onClick={() => reset()}
        className="px-6 py-3 text-lg font-medium bg-blue-600 hover:bg-blue-700 text-white"
      >
        Retry Simulation
      </Button>
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        If the problem persists, please contact support.
      </p>
    </div>
  );
}

