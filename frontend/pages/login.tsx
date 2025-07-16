import Head from 'next/head';
import AuthForm from '../components/AuthForm';

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Login | Investment Tools Hub</title>
        <meta name="description" content="Login to access your investment dashboard." />
      </Head>

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
