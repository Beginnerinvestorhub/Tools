// /data/data/com.termux/files/home/beginnerinvestorhub/tools/apps/web/src/app/page.tsx

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import NewsletterSignup from '@/components/NewsletterSignup';
import FeatureCard from '@/components/FeatureCard';
import ValueProposition from '@/components/ValueProposition';
import TestimonialCard from '@/components/TestimonialCard';
import {
  AcademicCapIcon,
  ScaleIcon,
  ChartBarIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'; // Assuming Heroicons are correctly installed

// Optional: Page-specific metadata for this homepage
export const metadata = {
  title: 'Home | Beginner Investor Hub', // This will override the global title for this page
  description: 'Your ultimate guide to starting your investment journey. Assess your risk, simulate portfolios, and get personalized insights.',
};

export default function HomePage() {
  return (
    // This div contains all the unique content for your homepage.
    // It will be rendered inside the <main> tag of app/layout.tsx.
    // The min-height calculation is good for pages without a lot of content
    // to ensure the footer is pushed to the bottom.
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16)-theme(spacing.16))] py-12 px-4 sm:px-6 lg:px-8 text-center">
      {/* This is the main heading for your homepage content */}
      <h1 className="text-5xl md:text-7xl font-extrabold text-indigo-800 mb-6">
        Investing starts with understanding.
      </h1>
      <p className="mt-2 text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
        Learn the principles of personal finance with hands-on tools and guidance.
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

      {/* Features */}
      <section className="w-full max-w-4xl flex flex-wrap justify-center gap-6 my-12">
        <FeatureCard
          // Removed w-10 h-10 here, letting FeatureCard itself size the icon consistently
          icon={<AcademicCapIcon className="text-indigo-600" />}
          title="Personal Risk Assessment"
          description="Understand your risk tolerance and get personalized investment suggestions."
        />
        <FeatureCard
          icon={<ScaleIcon className="text-indigo-600" />}
          title="Fractional Share Calculator"
          description="See how you can invest any amount, no matter how small, in top companies."
        />
        <FeatureCard
          icon={<ChartBarIcon className="text-indigo-600" />}
          title="Portfolio Monitoring Dashboard"
          description="Track your investments, performance, and diversification in one place."
        />
        <FeatureCard
          icon={<GlobeAltIcon className="text-indigo-600" />}
          title="ESG/SRI Screening Tool"
          description="Align your investments with your values using ESG and SRI filters."
        />
      </section>

      {/* Why It Matters */}
      <ValueProposition
        title="Why It Matters"
        points={[
          'Educational-first approach: Learn as you invest.',
          'Secure data handling: Your privacy and security are our top priority.',
          'Beginner-friendly design: No jargon, just clarity.',
          'Privacy-compliant: We respect your data and choices.',
        ]}
      />

      {/* Testimonials */}
      <section className="w-full max-w-4xl flex flex-wrap justify-center gap-4 my-12">
        <TestimonialCard
          quote="I finally feel confident about my investments. The tools are so easy to use!"
          author="Alex P."
          role="New Investor"
        />
        <TestimonialCard
          quote="The risk assessment helped me understand what’s right for me. Highly recommend."
          author="Jamie R."
          role="Personal Finance Learner"
        />
        <TestimonialCard
          quote="Love the ESG screening—now I can invest in line with my values."
          author="Taylor S."
          role="Conscious Investor"
        />
      </section>

      <NewsletterSignup />
    </div>
  );
}
