import Stripe from 'stripe';

// It's recommended to use environment variables for your secret keys.
// Make sure to set STRIPE_SECRET_KEY in your .env file or environment.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16', // Pin to a specific API version
  typescript: true,
});

/**
 * Finds the default Stripe Billing Portal configuration.
 * @returns {Promise<Stripe.BillingPortal.Configuration | undefined>} The default configuration or undefined if not found.
 */
async function findDefaultPortalConfiguration(): Promise<Stripe.BillingPortal.Configuration | undefined> {
    try {
        const configurations = await stripe.billingPortal.configurations.list({ is_default: true, limit: 1 });
        if (configurations.data.length > 0) {
            console.log(`Found default configuration with ID: ${configurations.data[0].id}`);
            return configurations.data[0];
        }
        console.log('No default billing portal configuration found.');
        return undefined;
    } catch (error) {
        console.error('Error fetching portal configurations:', error);
        throw error;
    }
}

/**
 * Updates the Stripe Billing Portal configuration with new URLs for the
 * privacy policy and terms of service.
 *
 * @param {string} configurationId - The ID of the billing portal configuration to update.
 * @param {string} privacyPolicyUrl - The new URL for the privacy policy.
 * @param {string} termsOfServiceUrl - The new URL for the terms of service.
 * @returns {Promise<Stripe.BillingPortal.Configuration>} The updated configuration object.
 */
export async function updatePortalBusinessProfile(
  configurationId: string,
  privacyPolicyUrl: string,
  termsOfServiceUrl: string
): Promise<Stripe.BillingPortal.Configuration> {
  console.log(`Updating Stripe Billing Portal configuration ${configurationId}...`);
  const updatedConfiguration = await stripe.billingPortal.configurations.update(
    configurationId,
    {
      business_profile: {
        privacy_policy_url: privacyPolicyUrl,
        terms_of_service_url: termsOfServiceUrl,
      },
    }
  );
  console.log('Successfully updated Stripe Billing Portal configuration.');
  return updatedConfiguration;
}

// Example of how to run this update from a setup script:
/*
async function main() {
    const defaultConfig = await findDefaultPortalConfiguration();
    if (defaultConfig) {
        const newPrivacyPolicyUrl = 'https://www.your-website.com/privacy';
        const newTermsOfServiceUrl = 'https://www.your-website.com/terms';

        await updatePortalBusinessProfile(defaultConfig.id, newPrivacyPolicyUrl, newTermsOfServiceUrl);
    }
}

main().catch(console.error);
*/