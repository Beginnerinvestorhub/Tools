/** @type {import('next').NextConfig} */
const withMDX = require('@next/mdx')({ extension: /\.mdx?$/ });

const nextConfig = withMDX({
  reactStrictMode: true,
  images: {
    domains: ['your-cdn.com'],
  },
  env: {
    NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NUDGE_ENGINE_API_KEY: process.env.NUDGE_ENGINE_API_KEY,
  },
  pageExtensions: ['js','jsx','ts','tsx','md','mdx'],
});

module.exports = nextConfig;
