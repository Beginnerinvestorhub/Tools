// apps/web/src/app/layout.tsx
import './globals.css';
import Navigation from '../components/common/Navigation'; // Import Navigation

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navigation /> {/* Add Navigation here */}
        {children}
      </body>
    </html>
  );
}

