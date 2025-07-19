import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import NewsletterSignup from '../components/NewsletterSignup';
import FeatureCard from '../components/FeatureCard';
import ValueProposition from '../components/ValueProposition';
import TestimonialCard from '../components/TestimonialCard';
import {
  AcademicCapIcon,
  ScaleIcon,
  ChartBarIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

export default function Home() {
  return (
    <Layout>
      <Head>
        <meta name="description" content="All-in-one investment tools, analytics, and insights." />
        <meta property="og:title" content="BeginnerInvestorHub.com" />
        <meta property="og:description" content="All-in-one investment tools, analytics, and insights." />
        <meta property="og:image" content="/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="BeginnerInvestorHub.com" />
        <meta name="twitter:description" content="All-in-one investment tools, analytics, and insights." />
        <meta name="twitter:image" content="/og-image.png" />
      </Head>

      <main className="flex flex-col items-center justify-center flex-1 px-4 text-center max-w-4xl mx-auto py-12">
        <h1 className="text-xl md:text-2xl text-indigo-600 mb-8 font-bold">
          Beginner Investor Hub
        </h1>
        <div className="flex flex-row gap-4 mb-8 justify-center">
          <Link href="/dashboard">
            <button className="px-6 py-3 bg-indigo-700 text-white rounded-lg font-semibold hover:bg-indigo-800">
              Try the Tools
            </button>
          </Link>
          <Link href="/signup">
            <button className="px-6 py-3 bg-white border border-indigo-700 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-50">
              Start Learning
            </button>
          </Link>
        </div>

        {/* Features */}
        <section className="w-full max-w-6xl my-12">
          <h2 className="text-2xl font-bold text-indigo-800 mb-8 text-center">Our Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
          <FeatureCard
            icon={<AcademicCapIcon />}
            title="Personal Risk Assessment"
            description="Understand your risk tolerance and get personalized investment suggestions."
          />
          <FeatureCard
            icon={<ScaleIcon />}
            title="Fractional Share Calculator"
            description="See how you can invest any amount, no matter how small, in top companies."
          />
          <FeatureCard
            icon={<ChartBarIcon />}
            title="Portfolio Monitoring Dashboard"
            description="Track your investments, performance, and diversification in one place."
          />
          <FeatureCard
            icon={<GlobeAltIcon />}
            title="ESG/SRI Screening Tool"
            description="Align your investments with your values using ESG and SRI filters."
          />
          </div>
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
      </main>
    </Layout>
  );
}
