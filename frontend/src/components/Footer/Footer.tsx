'use client';

import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {/* Brand & Identity Column */}
        <div className={styles.brandCol}>
          <Link href="/" className={styles.logoRow}>
            <img src="/images/logo-white.png" alt="Scrizians Logo" className={styles.footerLogoImg} />
          </Link>
          {/* <div className={styles.tagline}>Talent. Technology. Together.</div> */}
          <p className={styles.parentText}>
            Global technology talent & managed software delivery platform powered by <a href="https://www.scriza.in/" target="_blank" rel="noopener noreferrer" className={styles.scrizaLink}>Scriza Private Limited</a>.
          </p>
          <div className={styles.contactDetails}>
            <a href="tel:+919119112999" className={styles.contactBadge}>
              <span className={styles.contactIcon}>📞</span> +91 91191 12999
            </a>
            <a href="mailto:support@scrizians.com" className={styles.contactBadge}>
              <span className={styles.contactIcon}>✉️</span> support@scrizians.com
            </a>
            <div className={styles.locationText}>
              📍 Noida, Delhi NCR & Global Remote Operations
            </div>
          </div>
        </div>

        {/* Hire Talent Column */}
        <div className={styles.navCol}>
          <h4 className={styles.colTitle}>Hire Talent</h4>
          <ul className={styles.linkList}>
            <li><Link href="/hire-developers-from-india">Hire Developers from India</Link></li>
            <li><Link href="/hire-talent?role=fullstack">Full Stack Developers</Link></li>
            <li><Link href="/hire-talent?role=frontend">Frontend Specialists</Link></li>
            <li><Link href="/hire-talent?role=backend">Backend Engineers</Link></li>
            <li><Link href="/hire-talent?role=devops">DevOps & Cloud Engineers</Link></li>
            <li><Link href="/hire-talent?role=aiml">AI / ML & Data Engineers</Link></li>
          </ul>
        </div>

        {/* Solutions Column */}
        <div className={styles.navCol}>
          <h4 className={styles.colTitle}>Solutions</h4>
          <ul className={styles.linkList}>
            <li><Link href="/pricing">Pricing & Models</Link></li>
            <li><Link href="/solutions#staff-augmentation">Staff Augmentation</Link></li>
            <li><Link href="/solutions#dedicated-developers">Dedicated Developers</Link></li>
            <li><Link href="/solutions#dedicated-team">Dedicated Offshore ODC</Link></li>
            <li><Link href="/solutions#remote-team">Remote Managed Projects</Link></li>
          </ul>
        </div>

        {/* Company & Platform Column */}
        <div className={styles.navCol}>
          <h4 className={styles.colTitle}>Company & Platform</h4>
          <ul className={styles.linkList}>
            <li><Link href="/about">About Scrizians</Link></li>
            <li><Link href="/about-scriza">About Scriza (Parent Org)</Link></li>
            <li><Link href="/portfolio">Portfolio Showcase</Link></li>
            <li><Link href="/become-a-scrizian">Join Scrizian Network</Link></li>
            <li><Link href="/jobs">Jobs & Careers</Link></li>
            <li><Link href="/insights">Insights & News</Link></li>
            <li><Link href="/contact">Contact Support</Link></li>
          </ul>
        </div>
      </div>

      {/* Clean & Professional Bottom Bar with Sitemap Link */}
      <div className={styles.bottomBar}>
        <div className={styles.copyText}>
          © 2026 <a href="https://www.scriza.in/" target="_blank" rel="noopener noreferrer" className={styles.scrizaLink}>Scriza Private Limited</a>. All rights reserved.
        </div>
        
       

        <div className={styles.policyLinks}>
          <Link href="/sitemap">Sitemap</Link>
          <Link href="/policies/privacy">Privacy Policy</Link>
          <Link href="/policies/terms">Terms of Service</Link>
          <Link href="/policies/cookie-policy">Cookie Policy</Link>
          <Link href="/policies/grievance">Trust & Security</Link>
        </div>
      </div>
    </footer>
  );
};
