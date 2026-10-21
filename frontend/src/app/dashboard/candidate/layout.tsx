import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Job Candidate Portal & Resume Hub | Scrizians',
  description: 'Manage job applications, upload verified resume credentials, track interview status, and view application pipelines with Scrizians.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Job Candidate Portal & Resume Hub | Scrizians',
    description: 'Manage job applications, upload verified resume credentials, track interview status, and view application pipelines with Scrizians.',
    url: 'https://scrizians.com/dashboard/candidate',
    siteName: 'Scrizians',
    type: 'website',
  },
};

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
