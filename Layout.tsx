import React from 'react';
import Navbar from './NavBar';

/**
 * A layout component that includes a "Skip to Main Content" link
 * for improved accessibility.
 */
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style jsx global>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
        .skip-link:focus {
          position: absolute;
          top: 1rem;
          left: 1rem;
          z-index: 100;
          padding: 0.5rem 1rem;
          background-color: #4f46e5; /* indigo-600 */
          color: white;
          text-decoration: none;
          border-radius: 0.375rem;
        }
      `}</style>
      <a href="#main-content" className="sr-only skip-link">Skip to main content</a>
      <Navbar />
      <main id="main-content" className="py-6">
        {children}
      </main>
    </>
  );
}
