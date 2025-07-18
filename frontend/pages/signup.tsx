import Head from 'next/head';
import AuthForm from '../components/components/components/AuthForm';

export default function SignupPage() {
  return (
    <>
      <Head>
        <title>Sign Up | Investment Tools Hub</title>
        <meta name="description" content="Create your account to start investing smarter." />
      </Head>
      <AuthForm mode="signup" />
    </>
  );
}
