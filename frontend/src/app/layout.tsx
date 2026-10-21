import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans, Manrope } from 'next/font/google';
import '@/styles/variables.css';
import 'react-phone-input-2/lib/style.css';
import { CurrencyProvider } from '@/context/CurrencyContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0B172A',
};

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://scrizians.com'),
  title: {
    default: 'Scrizians — Build Your Team with Curated Tech Talent from India',
    template: '%s | Scrizians'
  },
  description: 'Global technology talent, careers and knowledge platform backed by Scriza Private Limited. Discover developers, designers, QA engineers, DevOps professionals and digital specialists through the Scrizians Talent Network.',
  keywords: ['Hire Developers India', 'Next.js Talent', 'React Developers', 'DevOps Engineers India', 'Staff Augmentation', 'Scriza Private Limited', 'Scrizian ID'],
  authors: [{ name: 'Scriza Private Limited', url: 'https://scrizians.com' }],
  creator: 'Scriza Private Limited',
  icons: {
    icon: '/favicon.ico?v=2',
    shortcut: '/favicon.ico?v=2',
    apple: '/favicon.ico?v=2'
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  alternates: {
    canonical: 'https://scrizians.com',
    languages: {
      'en-US': 'https://scrizians.com',
      'en-IN': 'https://scrizians.com',
      'en-GB': 'https://scrizians.com',
      'en-AE': 'https://scrizians.com',
      'x-default': 'https://scrizians.com'
    }
  },
  openGraph: {
    title: 'Scrizians — Talent. Technology. Together.',
    description: 'Curated technology talent. Protected professional identities. Managed hiring. Practical knowledge. Built for India and the world by Scriza Private Limited.',
    url: 'https://scrizians.com',
    siteName: 'Scrizians',
    images: [
      {
        url: 'https://scrizians.com/images/logo.png',
        width: 1200,
        height: 630,
        alt: 'Scrizians Logo'
      }
    ],
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scrizians — Build Your Team with Curated Tech Talent from India',
    description: 'Discover developers, designers, QA engineers, DevOps professionals and digital specialists through the Scrizians Talent Network.',
    images: ['https://scrizians.com/images/logo.png']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  }
};

const jsonLdOrgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Scrizians',
  legalName: 'Scriza Private Limited',
  url: 'https://scrizians.com',
  logo: 'https://scrizians.com/images/logo.png',
  telephone: '+91-91191-12999',
  email: 'info@scriza.in',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'NX-ONE, Tech Zone IV, Plot No 17',
    addressLocality: 'Greater Noida',
    addressRegion: 'Uttar Pradesh',
    postalCode: '201318',
    addressCountry: 'IN'
  },
  sameAs: [
    'https://linkedin.com',
    'https://facebook.com',
    'https://instagram.com'
  ]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico?v=2" />
        <link rel="apple-touch-icon" href="/favicon.ico?v=2" />
        <link rel="preload" href="/images/logo-dark.png" as="image" type="image/png" fetchPriority="high" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrgSchema) }}
        />
      </head>
      <body className={`${manrope.className}`} suppressHydrationWarning>
        <CurrencyProvider>
          {children}
        </CurrencyProvider>
      </body>
    </html>
  );
}
