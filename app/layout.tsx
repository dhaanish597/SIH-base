import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Quest Academy — Gamified Learning',
  description:
    'School-exclusive gamified learning platform for grades 6–12. Play educational games, earn XP, and master every subject.',
  keywords: ['education', 'gamified learning', 'school', 'quiz', 'math dungeon'],
  robots: { index: false, follow: false }, // school-exclusive: no public indexing
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Fonts: Bowlby One + Fredoka One (display), Nunito (body), Oswald + Bebas Neue (HUD), JetBrains Mono (scores/numbers) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bowlby+One&family=Fredoka+One&family=Nunito:wght@400;600;700;800&family=Oswald:wght@400;600;700&family=Bebas+Neue&family=JetBrains+Mono:wght@500;700&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0A0A14" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
