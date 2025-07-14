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
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [router.pathname]);

  return (
    <nav className="w-full bg-white shadow-md py-3 px-4 flex items-center justify-between sticky top-0 z-50">
      <div className="font-extrabold text-indigo-700 text-xl">
        <Link href="/">BeginnerInvestorHub</Link>
      </div>
      {/* Desktop nav */}
      <div className="hidden md:flex gap-2 md:gap-4 items-center">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} legacyBehavior>
            <a
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-150 hover:bg-indigo-100 hover:text-indigo-700 ${
                router.pathname === link.href ? 'bg-indigo-50 text-indigo-800' : 'text-gray-700'
              }`}
            >
              {link.label}
            </a>
          </Link>
        ))}
      </div>
      {/* Mobile hamburger */}
      <button
        className="md:hidden flex items-center px-2 py-1 border rounded text-indigo-700 border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={menuOpen}
        aria-controls="mobile-nav-menu"
        onClick={() => setMenuOpen((v) => !v)}
      >
        <span className="sr-only">Toggle navigation</span>
        <svg
          className={`h-6 w-6 transition-transform duration-300 ${menuOpen ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          {menuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>
      {/* Mobile menu */}
      <div
        ref={menuRef}
        id="mobile-nav-menu"
        className={`fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity duration-300 ease-in-out ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        } md:hidden`}
        aria-hidden={!menuOpen}
      >
        <div
          className={`absolute right-4 top-4 bg-white rounded-lg shadow-lg p-6 w-60 flex flex-col gap-2 transform transition-transform duration-300 ease-in-out ${
            menuOpen ? 'translate-y-0 scale-100' : '-translate-y-8 scale-95'
          }`}
          tabIndex={-1}
        >
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} legacyBehavior>
              <a
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-150 hover:bg-indigo-100 hover:text-indigo-700 ${
                  router.pathname === link.href ? 'bg-indigo-50 text-indigo-800' : 'text-gray-700'
                }`}
                tabIndex={menuOpen ? 0 : -1}
                aria-current={router.pathname === link.href ? 'page' : undefined}
              >
                {link.label}
              </a>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
