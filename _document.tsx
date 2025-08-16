import { Html, Head, Main, NextScript } from 'next/document';

/**
 * Custom Next.js Document to augment the application's <html> and <body> tags.
 * This is used for server-side rendering of static elements like fonts,
 * meta tags, and language attributes.
 */
export default function Document() {
  return (
    // The lang="en" attribute is added for accessibility and SEO.
    <Html lang="en">
      <Head>
        {/* Preload critical fonts here for performance */}
        {/* <link rel="preload" href="/fonts/inter-var-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" /> */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}