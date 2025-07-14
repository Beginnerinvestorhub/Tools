import Head from 'next/head';
import AuthForm from '../components/AuthForm';

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Login | Investment Tools Hub</title>
        <meta name="description" content="Login to access your investment dashboard." />
      </Head>
      <AuthForm mode="login" />
    </>
  );
}
