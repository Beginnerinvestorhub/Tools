import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '../../store/authStore';

/**
 * Higher-order component for route protection.
 *
 * Redirects unauthenticated users to the login page.
 *
 * @param {React.ComponentType} WrappedComponent The component to wrap.
 * @returns {React.ComponentType} A wrapped component with authentication check.
 */
function withAuth<P extends object>(WrappedComponent: React.ComponentType<P>) {
  // Create a new component that wraps the original
  const AuthWrapper: React.ComponentType<P> = (props) => {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/login');
      }
    }, [isAuthenticated, isLoading, router]);

    // If loading, or not authenticated, return null (or a loading indicator)
    if (isLoading || !isAuthenticated) {
      return null; // Or a loading spinner, etc.
    }

    // Otherwise render the wrapped component with all props
    return <WrappedComponent {...props} />;
  };

  // Set a display name for easy debugging
  AuthWrapper.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return AuthWrapper;
}

export default withAuth;