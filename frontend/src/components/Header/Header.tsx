'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCurrency } from '@/context/CurrencyContext';
import styles from './Header.module.css';

interface HeaderProps {
  onOpenLeadModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenLeadModal }) => {
  const { currency, toggleCurrency } = useCurrency();
  const pathname = usePathname();
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('scrizians_user');
    if (stored) {
      try {
        setLoggedInUser(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  // Auto close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const getDashboardHref = () => {
    if (!loggedInUser) return '/login';
    if (loggedInUser.role === 'admin' || loggedInUser.role === 'scriza_staff') return '/dashboard/admin';
    if (loggedInUser.role === 'client') return '/dashboard/client';
    if (loggedInUser.role === 'contributor') return '/dashboard/contributor';
    if (loggedInUser.role === 'candidate') return '/dashboard/candidate';
    return '/dashboard/talent';
  };

  const navLinks = [
    { href: '/hire-talent', label: 'Hire Talent' },
    { href: '/talent', label: 'Talent Network' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/solutions', label: 'Solutions' },
    { href: '/technologies', label: 'Technologies' },
    { href: '/case-studies', label: 'Case Studies' }
  ];

  return (
    <header className={styles.header}>
      {/* Top Bar */}
      <div className={styles.topbar}>
        <div className={styles.topbarInner}>
          <span className={styles.topbarslogan}>Talent. Technology. Together.</span>
          <div className={styles.topRight}>
            <a href="tel:+919119112999" className={styles.phoneLink} aria-label="Call Scrizians customer support at +91 91191 12999">
              📞 +91 91191 12999
            </a>
            <div className={styles.currencyToggle} role="group" aria-label="Currency Switcher">
              <button 
                type="button"
                className={`${styles.currBtn} ${currency === 'USD' ? styles.currBtnActive : ''}`}
                onClick={() => toggleCurrency('USD')}
                aria-label="Switch currency to USD"
              >
                $ USD
              </button>
              <button 
                type="button"
                className={`${styles.currBtn} ${currency === 'INR' ? styles.currBtnActive : ''}`}
                onClick={() => toggleCurrency('INR')}
                aria-label="Switch currency to INR"
              >
                ₹ INR
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className={styles.mainNav}>
        <div className={styles.inner}>
          <Link href="/" className={styles.brand} aria-label="Scrizians Homepage">
            <img src="/images/logo-dark.png" alt="Scrizians Logo" className={styles.brandImg} width={180} height={42} fetchPriority="high" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className={styles.nav} aria-label="Main Navigation">
            {navLinks.map(link => (
              <Link 
                key={link.href}
                href={link.href} 
                className={`${styles.navLink} ${pathname === link.href ? styles.navLinkActiveRedText : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className={styles.actions}>
            <Link href="/become-a-scrizian" className={styles.btnBecome}>
              Become a Scrizian
            </Link>

            {onOpenLeadModal ? (
              <button 
                type="button"
                className={styles.btnHire} 
                onClick={onOpenLeadModal}
              >
                Hire Talent
              </button>
            ) : (
              <Link href="/hire-talent" className={styles.btnHire}>
                Hire Talent
              </Link>
            )}

            {/* Mobile Hamburger Toggle Button */}
            <button 
              type="button"
              className={styles.hamburgerBtn}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Mobile Navigation Drawer"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slide-Over Drawer Navigation */}
      {isMobileMenuOpen && (
        <>
          <div 
            className={styles.mobileBackdrop} 
            onClick={() => setIsMobileMenuOpen(false)} 
            aria-hidden="true"
          />
          <div className={styles.mobileDrawer} role="dialog" aria-label="Mobile Navigation Menu">
            <div className={styles.drawerHeader}>
              <img src="/images/logo-white.png" alt="Scrizians Logo" className={styles.drawerLogo} width={150} height={34} />
              <button 
                type="button"
                className={styles.drawerCloseBtn}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close Mobile Navigation Drawer"
              >
                ✕
              </button>
            </div>

            <div className={styles.drawerBody}>
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.drawerNavLink} ${pathname === link.href ? styles.drawerNavLinkActive : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span>{link.label}</span>
                  <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>→</span>
                </Link>
              ))}

              <div className={styles.drawerDivider} />

              <Link 
                href="/become-a-scrizian" 
                className={styles.drawerNavLink}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>Become a Scrizian</span>
                <span>💼</span>
              </Link>

              {loggedInUser && (
                <Link 
                  href={getDashboardHref()} 
                  className={styles.drawerNavLink}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span>Dashboard</span>
                  <span>👤</span>
                </Link>
              )}
            </div>

            <div className={styles.drawerFooter}>
              {onOpenLeadModal ? (
                <button 
                  type="button"
                  className={styles.btnHire} 
                  style={{ width: '100%', padding: '0.75rem' }}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenLeadModal();
                  }}
                >
                  Hire Talent Now
                </button>
              ) : (
                <Link 
                  href="/hire-talent" 
                  className={styles.btnHire}
                  style={{ width: '100%', textAlign: 'center', padding: '0.75rem' }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Hire Talent Now
                </Link>
              )}

              <a 
                href="tel:+919119112999" 
                className={styles.phoneLink} 
                aria-label="Call Scrizians support at +91 91191 12999"
                style={{ justifyContent: 'center', color: '#0F172A', fontWeight: 700, fontSize: '0.9rem', marginTop: '0.4rem' }}
              >
                📞 Call: +91 91191 12999
              </a>
            </div>
          </div>
        </>
      )}
    </header>
  );
};
