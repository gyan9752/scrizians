import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://scrizians.com'),
  title: 'Admin & Operations Control Panel | Scrizians',
  description: 'Scriza Admin & Staff Control Panel. Manage inbound hiring leads, talent profile verification, job postings, content review, and platform configuration.',
  alternates: {
    canonical: 'https://scrizians.com/dashboard/admin',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Admin & Operations Control Panel | Scrizians',
    description: 'Scriza Admin & Staff Control Panel. Manage inbound hiring leads, talent profile verification, job postings, content review, and platform configuration.',
    url: 'https://scrizians.com/dashboard/admin',
    siteName: 'Scrizians',
    type: 'website',
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
