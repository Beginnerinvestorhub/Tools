// /data/data/com.termux/files/home/beginnerinvestorhub/tools/apps/web/tailwind.config.ts

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/shared-ui/**/*.{js,ts,jsx,tsx,mdx}', // IMPORTANT: Include paths to shared UI components if applicable
  ],
  theme: {
    extend: {
      // You can extend Tailwind's default theme here
      // For example, adding custom colors, fonts, spacing, etc.
      colors: {
        'primary-brand': '#FF6B6B',
        'secondary-accent': '#4ECDC4',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Example: If you use a custom font like Inter
      },
      // You can also add custom breakpoints, spacing, etc.
    },
  },
  plugins: [], // Add Tailwind CSS plugins here (e.g., @tailwindcss/forms, @tailwindcss/typography)
};

export default config;

