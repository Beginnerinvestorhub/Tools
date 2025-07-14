import React from 'react';
import { Helmet } from 'react-helmet';
import Link from 'next/link';
import NewsletterSignup from '../components/NewsletterSignup';
import FeatureCard from '../components/FeatureCard';
import ValueProposition from '../components/ValueProposition';
import TestimonialCard from '../components/TestimonialCard';
import { AcademicCapIcon, ScaleIcon, ChartBarIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center">
      <Helmet>
        <title>BeginnerInvestorHub.com</title>
        <meta name="description" content="All-in-one investment tools, analytics, and insights." />
        <meta property="og:title" content="BeginnerInvestorHub.com" />
        <meta property="og:description" content="All-in-one investment tools, analytics, and insights." />
        <meta property="og:image" content="/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="BeginnerInvestorHub.com" />
        <meta name="twitter:description" content="All-in-one investment tools, analytics, and insights." />
        <meta name="twitter:image" content="/og-image.png" />
      </Helmet>
      <main className="flex flex-col items-center justify-center flex-1 px-4 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold text-indigo-800 mb-6">
          Investing starts with understanding.
        </h1>
        <p className="text-xl md:text-2xl text-indigo-600 mb-8">
          Learn the principles of personal finance with hands-on tools and guidance.
        </p>
        <div className="flex gap-4 mb-8">
          <Link href="/dashboard">
            <button className="px-6 py-3 bg-indigo-700 text-white rounded-lg font-semibold hover:bg-indigo-800">Try the Tools</button>
          </Link>
          <Link href="/signup">
            <button className="px-6 py-3 bg-white border border-indigo-700 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-50">Start Learning</button>
          </Link>
        </div>

        {/* Features Overview */}
        <section className="w-full max-w-5xl flex flex-wrap justify-center gap-4 my-12">
          <FeatureCard
            icon={<AcademicCapIcon className="w-12 h-12" />}
            title="Personal Risk Assessment"
            description="Understand your risk tolerance and get personalized investment suggestions."
          />
          <FeatureCard
            icon={<ScaleIcon className="w-12 h-12" />}
            title="Fractional Share Calculator"
            description="See how you can invest any amount, no matter how small, in top companies."
          />
          <FeatureCard
            icon={<ChartBarIcon className="w-12 h-12" />}
            title="Portfolio Monitoring Dashboard"
            description="Track your investments, performance, and diversification in one place."
          />
          <FeatureCard
            icon={<GlobeAltIcon className="w-12 h-12" />}
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
            'Privacy-compliant: We respect your data and choices.'
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
      </main>
      <footer className="w-full py-8 text-center text-indigo-400 text-sm flex flex-col items-center gap-2 border-t border-indigo-100 mt-8">
        <div>
          &copy; {new Date().getFullYear()} BeginnerInvestorHub.com
        </div>
        <nav className="flex gap-4">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/signup">Sign Up</Link>
        </nav>
        <div>
          Not investment advice. For educational purposes only.
        </div>
      </footer>
    </div>
  );
}
