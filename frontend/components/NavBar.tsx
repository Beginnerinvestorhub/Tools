import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/tools', label: 'Tools' },
  { href: '/learn', label: 'Learn' },
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
    <nav className="relative bg-white border-b border-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-indigo-700" aria-label="Home">
              {/* Logo placeholder */}
              <span className="sr-only">Home</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}>
                <span
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 cursor-pointer ${
                    pathname === link.href
                      ? 'bg-indigo-50 text-indigo-800'
                      : 'text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'
                  }`}
                >
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
          
          {/* Mobile menu button */}
          <button
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
        </div>
      </div>
      
      {/* Mobile menu overlay - Conditionally rendered */}
      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-white shadow-md md:hidden z-50">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-150 ${
                  pathname === link.href
                    ? 'bg-indigo-50 text-indigo-800'
                    : 'text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
