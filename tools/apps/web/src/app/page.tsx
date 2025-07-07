// /data/data/com.termux/files/home/beginnerinvestorhub/tools/apps/web/src/app/page.tsx

import Link from 'next/link';
// Assuming you move your reusable UI components to packages/ui
// import { Button } from '@beginnerinvestorhub/ui';
// import { Card } from '@beginnerinvestorhub/ui';

// If keeping local for now:
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16)-theme(spacing.16))] py-12 px-4 sm:px-6 lg:px-8 text-center">
      {/* Calculate min-height to account for Navigation and Footer if they have fixed heights */}
      <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
        Beginner Investor Hub
      </h1>
      <p className="mt-2 text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
        Your ultimate guide to starting your investment journey. Assess your risk,
        simulate portfolios, and get personalized insights.
      </p>

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link href="/risk-assessment" passHref legacyBehavior>
          <Button className="px-6 py-3 text-lg font-medium">
            Start Risk Assessment
          </Button>
        </Link>
        <Link href="/portfolio-simulation" passHref legacyBehavior>
          <Button variant="outline" className="px-6 py-3 text-lg font-medium">
            Run Portfolio Simulation
          </Button>
        </Link>
      </div>

      <div className="mt-16 w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Assess Your Risk
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Understand your investment personality and risk tolerance with our interactive assessment.
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Simulate Portfolios
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Experiment with different investment strategies and see potential outcomes over time.
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-300 mb-4">
            Get Personalized Nudges
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Receive AI-powered insights to help you avoid common behavioral biases.
          </p>
        </Card>
      </div>
    </div>
  );
}

