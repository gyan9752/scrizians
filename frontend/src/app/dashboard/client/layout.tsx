import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://scrizians.com'),
  title: 'Client & Company Hiring Portal | Scrizians',
  description: 'Manage active hiring requirements, review shortlisted tech talent, schedule video interviews, and track billing statements with Scrizians.',
  alternates: {
    canonical: 'https://scrizians.com/dashboard/client',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Client & Company Hiring Portal | Scrizians',
    description: 'Manage active hiring requirements, review shortlisted tech talent, schedule video interviews, and track billing statements with Scrizians.',
    url: 'https://scrizians.com/dashboard/client',
    siteName: 'Scrizians',
    type: 'website',
  },
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
