// apps/web/src/components/common/Navigation.tsx
import React from 'react';
import Link from 'next/link';

const Navigation: React.FC = () => {
  return (
    <nav className="bg-gray-800 p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-lg font-bold">
          Beginner Investor Hub
        </Link>
        <ul className="flex space-x-4">
          <li>
            <Link href="/tools/risk-assessment" className="hover:text-gray-300">
              Risk Assessment
            </Link>
          </li>
          <li>
            <Link href="/tools/portfolio-simulation" className="hover:text-gray-300">
              Portfolio Simulation
            </Link>
          </li>
          <li>
            <Link href="/about" className="hover:text-gray-300">
              About
            </Link>
          </li>
          <li>
            <Link href="/contact" className="hover:text-gray-300">
              Contact
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;

