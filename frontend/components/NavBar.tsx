import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/tools', label: 'Tools' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/risk-assessment', label: 'Risk Assessment' },
  { href: '/fractional-share-calculator', label: 'Fractional Shares' },
  { href: '/portfolio-monitor', label: 'Portfolio Monitor' },
  { href: '/esg-screener', label: 'ESG Screener' }
]

/**
 * Navbar component that provides navigation links and a responsive menu.
 * 
 * Renders a horizontal navigation bar with links when viewed on medium or larger screens.
 * On smaller screens, it displays a hamburger menu icon that toggles a vertical menu overlay.
 * 
 * - Uses `usePathname` to track the current route and highlight the active link.
 * - Manages the menu's open/close state with `useState`.
 * - Closes the menu when clicking outside or when the route changes using `useEffect`.
 * - Includes accessibility features such as `aria-label` for the hamburger button.
 */
/**
 * Navbar component that provides navigation links and a responsive menu.
 * 
 * Renders a horizontal navigation bar with links when viewed on medium or larger screens.
 * On smaller screens, it displays a hamburger menu icon that toggles a vertical menu overlay.
 * 
 * - Uses `usePathname` to track the current route and highlight the active link.
 * - Manages the menu's open/close state with `useState`.
 * - Closes the menu when clicking outside or when the route changes using `useEffect`.
 * - Includes accessibility features such as `aria-label` for the hamburger button.
 */
export default function Navbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', onClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [menuOpen])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <>
      <div className="hidden md:flex gap-4">
      {navLinks.map(link => (
        <Link key={link.href} href={link.href}>
          <span
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 cursor-pointer ${pathname === link.href
                ? 'bg-indigo-50 text-indigo-800'
                : 'text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'}`}
          >
            {link.label}
          </span>
        </Link>
      ))}
    </div><button
      ref={buttonRef}
      onClick={() => setMenuOpen(open => !open)}
      className="md:hidden flex items-center px-2 py-1 border rounded text-indigo-700 border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      aria-label={menuOpen ? "Close menu" : "Open menu"}
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
              d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16" />
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
    </>)}