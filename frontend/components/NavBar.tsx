import Link from 'next/link';
import { useRouter } from 'next/router';
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
export default function NavBar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
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
  }, [router.pathname]);

  return (
    <nav className="w-full bg-white shadow-md py-3 sticky top-0 z-50">
      <div className="page-wrapper flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-extrabold text-indigo-700 text-xl">
          BeginnerInvestorHub
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex gap-4 items-center">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <span
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 cursor-pointer ${
                  router.pathname === link.href
                    ? 'bg-indigo-50 text-indigo-800'
                    : 'text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'
                }`}
              >
                {link.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex items-center px-2 py-1 border rounded text-indigo-700 border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
          ref={menuRef}
        >
          {/* Hamburger icon */}
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
      </div>
    </nav>
  );
}