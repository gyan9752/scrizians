import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scrizians Dashboard',
  description: 'Scrizians private dashboard.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}