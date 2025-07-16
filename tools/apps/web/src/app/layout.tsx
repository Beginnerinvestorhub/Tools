// /data/data/com.termux/files/home/beginnerinvestorhub/tools/apps/web/src/app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Example: Using Google Fonts
import './globals.css'; // Import global CSS here

// Assuming these components exist in apps/web/src/components/common or packages/ui
import Navigation from '@/components/common/Navigation'; // Adjusted to use NavBar component
import Footer from '@/components/common/Footer';

// Initialize your primary font (e.g., Inter from Google Fonts)
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// Define metadata for the entire application
// This sets the default browser tab title and description for all pages
export const metadata: Metadata = {
  title: 'Beginner Investor Hub', // This is your main site title
  description: 'Your ultimate guide to starting your investment journey.',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable}>
      {/* The <head> tag is implicitly handled by Next.js App Router's metadata export */}
      <body className="min-h-screen flex flex-col">
        {/* This div acts as the main content wrapper for centering and max-width */}
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex-grow flex flex-col">
          {/* Navigation component (now correctly named NavBar) */}
          <Navigation /> {/* Make sure this imports your NavBar component */}

          {/* Main content area - `children` will be the content of the current page. */}
          {/* Use flex-grow to make content fill available space between header and footer. */}
          {/* Added py-8 for vertical spacing */}
          <main className="flex-grow py-8">
            {children}
          </main>

          {/* Footer component */}
          <Footer />
        </div>
      </body>
    </html>
  );
}
