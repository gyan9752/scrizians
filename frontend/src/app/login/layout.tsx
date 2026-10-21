import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portal Authentication & Sign In | Scrizians',
  description: 'Sign in to access your Scrizians admin control panel, talent network profile, client company portal, or candidate workspace.',
  keywords: ['Scrizians Login', 'Scrizian ID Authentication', 'Talent Portal', 'Client Portal', 'Scriza Private Limited'],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Portal Authentication & Sign In | Scrizians',
    description: 'Sign in to access your Scrizians admin control panel, talent network profile, client company portal, or candidate workspace.',
    url: 'https://scrizians.com/login',
    siteName: 'Scrizians',
    type: 'website',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
