'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('scrizians_user');

    if (!storedUser) {
      router.replace('/login');
      return;
    }

    try {
      const user = JSON.parse(storedUser);

      switch (user.role) {
        case 'admin':
        case 'scriza_staff':
          router.replace('/dashboard/admin');
          break;

        case 'client':
          router.replace('/dashboard/client');
          break;

        case 'contributor':
          router.replace('/dashboard/contributor');
          break;

        case 'candidate':
          router.replace('/dashboard/candidate');
          break;

        case 'scrizian':
          router.replace('/dashboard/talent');
          break;

        default:
          localStorage.removeItem('scrizians_user');
          localStorage.removeItem('scrizians_token');
          router.replace('/login');
      }
    } catch {
      localStorage.removeItem('scrizians_user');
      localStorage.removeItem('scrizians_token');
      router.replace('/login');
    }
  }, [router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0B172A',
        color: '#ffffff',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <img
          src="/images/logo-white.png"
          alt="Scrizians Logo"
          style={{
            height: '42px',
            marginBottom: '1rem',
            objectFit: 'contain',
          }}
        />

        <h2
          style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            margin: '0.5rem 0',
          }}
        >
          Redirecting to Scrizians Portal...
        </h2>

        <p
          style={{
            color: '#94A3B8',
            fontSize: '0.9rem',
            margin: 0,
          }}
        >
          Please wait while we set up your session.
        </p>
      </div>
    </div>
  );
}