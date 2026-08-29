import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Growth of Knowledge | 8-Bit Retro RPG Gamification',
  description:
    'Petualangan kuis gamifikasi 8-bit bertema perpustakaan kuno dan jembatan kristal. Belajar dengan seru, kumpulkan bintang pengetahuan, dan dapatkan sertifikat kelulusan!',
  keywords: ['The Growth of Knowledge', 'kuis retro', 'gamifikasi', 'perpustakaan', '8-bit', 'RPG', 'pendidikan', 'Indonesia'],
  authors: [{ name: 'The Growth of Knowledge Academy' }],
  openGraph: {
    title: 'The Growth of Knowledge',
    description: 'Petualangan kuis RPG 8-bit untuk mengasah ilmu dan pengetahuan!',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Silkscreen:wght@400;700&family=Pixelify+Sans:wght@400;500;600;700&family=VT323&family=Great+Vibes&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-library-study min-h-screen text-slate-100 antialiased selection:bg-amber-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
