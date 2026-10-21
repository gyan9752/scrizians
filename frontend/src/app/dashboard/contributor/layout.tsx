import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Technical Contributor Desk | Scrizians',
  description: 'Write, publish, and manage technical articles, hiring guides, and developer engineering insights for the Scrizians network.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Technical Contributor Desk | Scrizians',
    description: 'Write, publish, and manage technical articles, hiring guides, and developer engineering insights for the Scrizians network.',
    url: 'https://scrizians.com/dashboard/contributor',
    siteName: 'Scrizians',
    type: 'website',
  },
};

export default function ContributorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
