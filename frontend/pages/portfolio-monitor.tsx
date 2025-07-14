import React from 'react';
import Head from 'next/head';
import PortfolioMonitor from '../components/PortfolioMonitor';

export default function PortfolioMonitorPage() {
  return (
    <>
      <Head>
        <title>Portfolio Monitoring Dashboard | BeginnerInvestorHub</title>
        <meta name="description" content="Track your portfolio performance and diversification over time." />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 flex flex-col items-center">
        <h1 className="text-3xl md:text-5xl font-extrabold text-indigo-800 mb-6 text-center">Portfolio Monitoring Dashboard</h1>
        <p className="text-lg text-gray-700 mb-8 text-center max-w-2xl">Visualize your portfolio allocation, performance, and asset details. Set alerts and monitor your investments in real time.</p>
        <PortfolioMonitor />
      </main>
    </>
  );
}
