import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { AcademicCapIcon, ScaleIcon, ChartBarIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const tools = [
  {
    name: 'Risk Assessment Tool',
    icon: <AcademicCapIcon className="w-10 h-10 text-indigo-600" />,
    description: 'Discover your risk tolerance and get a personalized investment profile.',
    href: '/risk-assessment',
  },
  {
    name: 'Fractional Share Calculator',
    icon: <ScaleIcon className="w-10 h-10 text-indigo-600" />,
    description: 'Calculate how much of a stock you can buy with any amount.',
    href: '/fractional-share-calculator',
  },
  {
    name: 'Portfolio Monitoring Dashboard',
    icon: <ChartBarIcon className="w-10 h-10 text-indigo-600" />,
    description: 'Track your portfolio performance and diversification over time.',
    href: '/dashboard',
  },
  {
    name: 'ESG/SRI Screening Tool',
    icon: <GlobeAltIcon className="w-10 h-10 text-indigo-600" />,
    description: 'Screen investments for environmental, social, and governance factors.',
    href: '/esg-screener',
  },
];

export default function ToolsOverview() {
  return (
    <>
      <Head>
        <title>Tools Overview | BeginnerInvestorHub</title>
        <meta name="description" content="Explore investment tools: risk assessment, calculators, dashboards, ESG screening." />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 flex flex-col items-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-indigo-800 mb-8 text-center">Explore Our Tools</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          {tools.map((tool) => (
            <div key={tool.name} className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center">
              <div>{tool.icon}</div>
              <h2 className="text-2xl font-bold text-indigo-700 mt-4 mb-2">{tool.name}</h2>
              <p className="text-gray-600 mb-6 text-center">{tool.description}</p>
              <Link href={tool.href}>
                <button className="px-6 py-2 bg-indigo-700 text-white rounded-lg font-semibold hover:bg-indigo-800 transition">Launch Tool</button>
              </Link>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
