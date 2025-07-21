import Head from 'next/head';
import { useAuth } from '../hooks/useAuth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import MainAppEmbed from '../components/MainAppEmbed';
import StripeCheckoutButton from '../components/StripeCheckoutButton';
import MarketDataWidget from '../components/MarketDataWidget';
import { useGamificationAPI } from '../hooks/useGamificationAPI';
import UserStatsCard from '../components/gamification/UserStatsCard';
import AchievementNotification from '../components/gamification/AchievementNotification';
// import { Badge, Achievement } from '../types/gamification'; // Unused for now

const STRIPE_PRICE_ID = 'price_12345';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [notification, setNotification] = useState<{
    type: 'badge' | 'achievement' | 'points';
    data: any;
  } | null>(null);

  const {
    userProgress,
    // badges,
    // achievements,
    // notifications,
    isLoading: gamificationLoading,
    error: gamificationError,
    trackEvent,
    // dismissNotification,
  } = useGamificationAPI(user?.uid || '');

  // Track daily login when component mounts
  useEffect(() => {
    if (user) {
      trackEvent('DAILY_LOGIN');
    }
  }, [user, trackEvent]);

  // Show gamification error if any
  useEffect(() => {
    if (gamificationError) {
      console.warn('Gamification error:', gamificationError);
    }
  }, [gamificationError]);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-indigo-700 text-lg font-semibold">
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div className="page-wrapper min-h-screen bg-gradient-to-br from-white to-indigo-50 flex flex-col">
      <Head>
        <title>Dashboard | Investment Tools Hub</title>
        <meta name="description" content="Your investment dashboard and tools." />
      </Head>

      <main className="max-w-5xl mx-auto py-12 flex flex-col gap-8">
        <h1 className="text-3xl md:text-4xl font-bold text-indigo-800 text-center">
          Welcome to your Dashboard
        </h1>

        {/* Gamification Progress */}
        {userProgress && !gamificationLoading && (
          <UserStatsCard 
            userProgress={userProgress} 
            compact={true}
            className="mb-6"
          />
        )}

        {/* Embedded App */}
        <MainAppEmbed />

        {/* Market Data Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-indigo-700 mb-4">
            Market Overview
          </h2>
          <MarketDataWidget
            alphaVantageKey={process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || ''}
            iexCloudKey={process.env.NEXT_PUBLIC_IEX_CLOUD_API_KEY || ''}
            symbol="AAPL"
            coinId="bitcoin"
          />
        </section>

        {/* Stripe Checkout */}
        <div className="flex justify-center">
          <StripeCheckoutButton priceId={STRIPE_PRICE_ID} />
        </div>
      </main>
      
      {/* Achievement Notifications */}
      {notification && (
        <AchievementNotification
          {...(notification.type === 'badge' ? { badge: notification.data } : {})}
          {...(notification.type === 'achievement' ? { achievement: notification.data } : {})}
          {...(notification.type === 'points' ? { points: notification.data } : {})}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
