// /data/data/com.termux/files/home/beginnerinvestorhub/tools/apps/web/src/components/common/Navigation.tsx

import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Correct import for Next.js App Router
import React, { useState, useRef, useEffect } from 'react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/tools', label: 'Tools' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/risk-assessment', label: 'Risk Assessment' },
  { href: '/fractional-share-calculator', label: 'Fractional Shares' },
  { href: '/portfolio-monitor', label: 'Portfolio Monitor' },
  { href: '/esg-screener', label: 'ESG Screener' },
];

/**
 * Navigation bar component.
 *
 * @remarks
 * This component renders a navigation bar with links to various pages.
 * It also renders a mobile hamburger menu.
 *
 * @returns A JSX element representing the navigation bar.
 */
export default function Navigation() { // Renamed from NavBar to Navigation for consistency with app/layout.tsx import
  const pathname = usePathname(); // Correct hook for App Router to get current path
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null); // Ref for the mobile menu button for click-outside

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // Check if the click is outside the menuRef (hamburger button) AND the menu itself (if it were a separate div)
      // For simplicity, we'll assume clicks outside the button or menu div should close it.
      // A more robust solution might involve another ref for the actual mobile menu overlay.
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]); // Depend on pathname from usePathname

  return (
    <nav className="w-full bg-white shadow-md py-3 sticky top-0 z-50">
      {/*
        This div ensures the content inside the nav (logo and links)
        is centered and has padding, matching the main layout's container.
      */}
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo/Site Title */}
        <Link href="/" className="font-extrabold text-indigo-700 text-xl">
          BeginnerInvestorHub
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex gap-4 items-center">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="block"> {/* Added 'block' for better link area */}
              <span
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 cursor-pointer ${
                  pathname === link.href // Use pathname for active link styling
                    ? 'bg-indigo-50 text-indigo-800'
                    : 'text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'
                }`}
              >
                {link.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Mobile hamburger button */}
        <button
          className="md:hidden flex items-center px-2 py-1 border rounded text-indigo-700 border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
          ref={menuRef} // Ref on the button to detect outside clicks
        >
          {/* Hamburger icon SVG */}
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>

        {/* Mobile menu overlay - Conditionally rendered */}
        {menuOpen && (
          <div className="absolute top-full left-0 w-full bg-white shadow-md md:hidden flex flex-col items-center py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="w-full text-center py-2 text-gray-800 hover:bg-indigo-50"
                onClick={() => setMenuOpen(false)} // Close menu on link click
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
