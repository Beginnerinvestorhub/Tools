// /data/data/com.termux/files/home/beginnerinvestorhub/tools/apps/web/src/app/login/page.tsx

// REMOVED: import Head from 'next/head'; // No longer needed in App Router

import AuthForm from '@/components/AuthForm'; // Assuming this path is correct

// Define page-specific metadata for the App Router
export const metadata = {
  title: 'Login | Beginner Investor Hub', // More consistent title
  description: 'Login to access your personalized investment dashboard and tools.',
};

export default function LoginPage() {
  return (
    // <> fragment is fine
    <>
      {/* The <Head> component is removed. Its functionality is replaced by the 'export const metadata' object above. */}

      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
        <section className="bg-white rounded-xl shadow-lg max-w-md w-full p-8">
          <h1 className="text-3xl font-extrabold text-indigo-800 mb-6 text-center">
            Welcome Back
          </h1>
          <p className="text-sm text-indigo-600 mb-8 text-center">
            Log in to your account to access your personalized investment dashboard.
          </p>
          <AuthForm mode="login" />
        </section>
      </main>
    </>
  );
}
