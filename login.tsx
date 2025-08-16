import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../store/authStore';
import Layout from '../components/Layout';
import LoginForm from '../components/auth/LoginForm'; // Assuming LoginForm component exists
import FullPageLoader from '../components/FullPageLoader'; // Assuming a loader component exists

/**
 * The login page for user authentication.
 * It automatically redirects authenticated users to the dashboard.
 */
const LoginPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to the dashboard if the user is already authenticated.
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show a loader while checking auth status or if redirecting
  if (isLoading || isAuthenticated) {
    return <FullPageLoader />;
  }

  return (
    <Layout>
      <LoginForm />
    </Layout>
  );
};

export default LoginPage;