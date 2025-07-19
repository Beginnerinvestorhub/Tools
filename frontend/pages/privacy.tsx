import Head from 'next/head';

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | BeginnerInvestorHub</title>
        <meta name="description" content="Read our Privacy Policy for BeginnerInvestorHub.com" />
      </Head>
      <main className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="mb-4">Your privacy is important to us. This Privacy Policy explains how BeginnerInvestorHub.com collects, uses, and protects your personal information.</p>
        <h2 className="text-xl font-semibold mt-8 mb-2">Information We Collect</h2>
        <ul className="list-disc ml-6 mb-4">
          <li>Personal information you provide (such as email, name, and profile data)</li>
          <li>Usage data and analytics</li>
          <li>Market and investment data you input</li>
        </ul>
        <h2 className="text-xl font-semibold mt-8 mb-2">How We Use Your Information</h2>
        <ul className="list-disc ml-6 mb-4">
          <li>To provide personalized financial tools and simulations</li>
          <li>To improve our services and user experience</li>
          <li>To comply with legal and regulatory requirements</li>
        </ul>
        <h2 className="text-xl font-semibold mt-8 mb-2">Data Security</h2>
        <p className="mb-4">We use industry-standard security measures, including encryption and access controls, to protect your data. User data is not shared with unauthorized parties. Users may request data export or deletion at any time.</p>
        <h2 className="text-xl font-semibold mt-8 mb-2">Third-Party Services</h2>
        <p className="mb-4">Market data is provided by licensed third-party providers. We do not sell your personal information to third parties.</p>
        <h2 className="text-xl font-semibold mt-8 mb-2">User Rights</h2>
        <ul className="list-disc ml-6 mb-4">
          <li>Access, export, or delete your data</li>
          <li>Contact us for privacy-related requests at support@beginnerinvestorhub.com</li>
        </ul>
        <h2 className="text-xl font-semibold mt-8 mb-2">Updates</h2>
        <p className="mb-4">This policy may be updated periodically. Please review regularly for changes.</p>
      </main>
    </>
  );
}
