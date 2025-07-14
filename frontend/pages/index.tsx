import React from 'react';
import { Helmet } from 'react-helmet';
import Link from 'next/link';
import NewsletterSignup from '../components/NewsletterSignup';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center">
      <Helmet>
        <title>Investment Tools Hub</title>
        <meta name="description" content="All-in-one investment tools, analytics, and insights." />
        <meta property="og:title" content="Investment Tools Hub" />
        <meta property="og:description" content="All-in-one investment tools, analytics, and insights." />
        <meta property="og:image" content="/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Investment Tools Hub" />
        <meta name="twitter:description" content="All-in-one investment tools, analytics, and insights." />
        <meta name="twitter:image" content="/og-image.png" />
      </Helmet>
      <main className="flex flex-col items-center justify-center flex-1 px-4 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold text-indigo-800 mb-6">
          Welcome to Investment Tools Hub
        </h1>
        <p className="text-xl md:text-2xl text-indigo-600 mb-8">
          Smarter investing, all in one place.
        </p>
        <div className="flex gap-4">
          <Link href="/dashboard">
            <button className="px-6 py-3 bg-indigo-700 text-white rounded-lg font-semibold hover:bg-indigo-800">Launch App</button>
          </Link>
          <Link href="/signup">
            <button className="px-6 py-3 bg-white border border-indigo-700 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-50">Sign Up</button>
          </Link>
        </div>
        <NewsletterSignup />
      </main>
      <footer className="w-full py-6 text-center text-indigo-400 text-sm">
        &copy; {new Date().getFullYear()} Investment Tools Hub
      </footer>
    </div>
  );
}
