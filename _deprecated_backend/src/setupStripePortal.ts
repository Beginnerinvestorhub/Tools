import Stripe from 'stripe';

// It's recommended to use environment variables for your secret keys.
// Make sure to set STRIPE_SECRET_KEY in your .env file or environment.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16', // Pin to a specific API version
  typescript: true,
});

