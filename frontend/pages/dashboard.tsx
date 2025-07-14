import Head from 'next/head';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import MainAppEmbed from '../components/MainAppEmbed';
import StripeCheckoutButton from '../components/StripeCheckoutButton';

// Replace with your Stripe Price ID
const STRIPE_PRICE_ID = 'price_12345';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <>
      <Head>
        <title>Dashboard | Investment Tools Hub</title>
        <meta name="description" content="Your investment dashboard and tools." />
      </Head>
      <MainAppEmbed />
      <div className="flex justify-center">
        <StripeCheckoutButton priceId={STRIPE_PRICE_ID} />
      </div>
    </>
  );
}
