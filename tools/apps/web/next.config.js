// /data/data/com.termux/files/home/beginnerinvestorhub/tools/apps/web/next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Recommended for identifying potential problems in an application
  swcMinify: true,       // Enable SWC minification for faster builds
  output: 'standalone',  // Optimizes for deployment (e.g., Docker) if you're using a Node.js server

  // Optional: Add custom webpack configurations
  // webpack: (config, { isDev, webpack }) => {
  //   // Example: Add a plugin for environment variables or adjust file loaders
  //   return config;
  // },

  // Optional: Configure image optimization (domains from which images are served)
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: 'https',
  //       hostname: 'example.com', // Replace with your image host
  //       port: '',
  //       pathname: '/my-images/**',
  //     },
  //   ],
  // },

  // Optional: Configure redirects, rewrites, headers
  // async redirects() {
  //   return [
  //     {
  //       source: '/old-path',
  //       destination: '/new-path',
  //       permanent: true,
  //     },
  //   ];
  // },

  // Optional: Environment variables available at build and run time
  // publicRuntimeConfig: {
  //   API_URL: process.env.NEXT_PUBLIC_API_URL, // Example: API URL accessible on client-side
  // },
  // serverRuntimeConfig: {
  //   // Example: Database credentials (only available on server-side)
  //   DB_PASSWORD: process.env.DB_PASSWORD,
  // },
};

module.exports = nextConfig;

