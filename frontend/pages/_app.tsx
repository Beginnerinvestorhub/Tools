import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import ReactGA from 'react-ga4';
import { Helmet } from 'react-helmet';
import NudgeChatWidget from '../components/NudgeChatWidget';
import NavBar from '../components/NavBar';
import { GlobalErrorBoundary } from '../components/ErrorBoundary';
import StateProvider from '../components/StateProvider';
import NotificationSystem from '../components/NotificationSystem';
import ModalSystem from '../components/ModalSystem';

const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    if (GA_TRACKING_ID) {
      ReactGA.initialize(GA_TRACKING_ID);
      const handleRouteChange = (url: string) => {
        ReactGA.send({ hitType: 'pageview', page: url });
      };
      router.events.on('routeChangeComplete', handleRouteChange);
      return () => {
        router.events.off('routeChangeComplete', handleRouteChange);
      };
    }
  }, [router.events]);

  // Global error handler for the error boundary
  const handleGlobalError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Send to analytics/monitoring service
    if (GA_TRACKING_ID) {
      ReactGA.event({
        category: 'Error',
        action: 'Global Error Boundary',
        label: error.message,
      });
    }
    
    // Log error info for debugging
    console.error('Global Error:', error, errorInfo);
  };

  return (
    <>
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#4338ca" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Investment Tools Hub" />
        <link rel="icon" href="/favicon.ico" />
      </Helmet>
      <StateProvider>
        <GlobalErrorBoundary onError={handleGlobalError}>
          <NavBar />
          <Component {...pageProps} />
          <NudgeChatWidget />
          <NotificationSystem />
          <ModalSystem />
        </GlobalErrorBoundary>
      </StateProvider>
    </>
  );
}

export default MyApp;
