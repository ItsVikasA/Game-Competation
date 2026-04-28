import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Catch the Falling Objects',
  description: 'A small arcade game built with Next.js, React, and Tailwind CSS.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
