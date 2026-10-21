import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scrizian Talent Profile & Network Portal | Scrizians',
  description: 'Manage your verified Scrizian developer profile, portfolio showcase, availability status, hourly rates, and incoming project opportunities.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Scrizian Talent Profile & Network Portal | Scrizians',
    description: 'Manage your verified Scrizian developer profile, portfolio showcase, availability status, hourly rates, and incoming project opportunities.',
    url: 'https://scrizians.com/dashboard/talent',
    siteName: 'Scrizians',
    type: 'website',
  },
};

export default function TalentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
