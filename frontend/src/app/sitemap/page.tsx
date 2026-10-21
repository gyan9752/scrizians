'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { LeadModal } from '@/components/LeadModal/LeadModal';
import styles from './Sitemap.module.css';

export default function SitemapPage() {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  const sitemapCategories = [
    {
      categoryTitle: 'Core Public Pages',
      icon: '🌐',
      links: [
        { label: 'Homepage', href: '/', desc: 'Main Scrizians talent platform landing' },
        { label: 'About Scrizians', href: '/about', desc: 'Our mission, vision, and talent network overview' },
        { label: 'About Scriza (Parent Org)', href: '/about-scriza', desc: 'Parent organization corporate profile & ecosystem' },
        { label: 'Pricing & Models', href: '/pricing', desc: 'Transparent hourly & monthly engagement rates' },
        { label: 'Contact Support', href: '/contact', desc: 'Connect with Scriza account leads & support' },
        { label: 'Become a Scrizian', href: '/become-a-scrizian', desc: 'Join the curated developer & designer network' }
      ]
    },
    {
      categoryTitle: 'Hire Tech Talent',
      icon: '🚀',
      links: [
        { label: 'Hire Developers from India', href: '/hire-developers-from-india', desc: 'Offshore tech talent with 100% timezone alignment' },
        { label: 'Hire Talent Directory', href: '/hire-talent', desc: 'Browse all technology roles & request interviews' },
        { label: 'Full Stack Developers', href: '/hire-talent?role=fullstack', desc: 'Next.js, Node.js, Python, & Cloud architects' },
        { label: 'Frontend Specialists', href: '/hire-talent?role=frontend', desc: 'React, Next.js, Vue, & TypeScript experts' },
        { label: 'Backend Engineers', href: '/hire-talent?role=backend', desc: 'Java, Spring Boot, Microservices, & APIs' },
        { label: 'DevOps & Cloud Engineers', href: '/hire-talent?role=devops', desc: 'AWS, GCP, Kubernetes, & Terraform IaC' },
        { label: 'AI / ML & Data Engineers', href: '/hire-talent?role=aiml', desc: 'Machine Learning, LLMs, & Data Pipelines' },
        { label: 'UI/UX Product Designers', href: '/hire-talent?role=uiux', desc: 'Figma design systems & B2B SaaS journeys' },
        { label: 'Explore Talent Network', href: '/talent', desc: 'Privacy-protected Scrizian ID profiles' }
      ]
    },
    {
      categoryTitle: 'Solutions & Delivery Models',
      icon: '⚙️',
      links: [
        { label: 'Solutions Overview', href: '/solutions', desc: 'Flexible software delivery & talent models' },
        { label: 'Staff Augmentation', href: '/solutions#staff-augmentation', desc: 'Scale your engineering team on demand' },
        { label: 'Dedicated Developers', href: '/solutions#dedicated-developers', desc: 'Full-time 40h/week dedicated engineers' },
        { label: 'Dedicated Offshore ODC', href: '/solutions#dedicated-team', desc: 'Turnkey offshore development center in India' },
        { label: 'Remote Managed Projects', href: '/solutions#remote-team', desc: 'End-to-end milestone-driven project execution' }
      ]
    },
    {
      categoryTitle: 'Technologies & Case Studies',
      icon: '💡',
      links: [
        { label: 'Technologies Overview', href: '/technologies', desc: 'Curated tech stacks and framework expertise' },
        { label: 'Portfolio Showcase', href: '/portfolio', desc: 'Real production projects delivered by Scrizians' },
        { label: 'Client Case Studies', href: '/case-studies', desc: 'Enterprise challenges, architectures, and outcomes' }
      ]
    },
    {
      categoryTitle: 'Careers & Knowledge',
      icon: '📚',
      links: [
        { label: 'Jobs & Careers', href: '/jobs', desc: 'Explore active job openings across tech roles' },
        { label: 'Insights & Engineering Blog', href: '/insights', desc: 'Hiring guides, tech tutorials, and insights' },
        { label: 'Write for Scrizians', href: '/write-for-scrizians', desc: 'Become a technical author or contributor' },
        { label: 'Community Network', href: '/community', desc: 'Join author discussions and technical forums' }
      ]
    },
    {
      categoryTitle: 'Legal, Security & SEO Index',
      icon: '🔒',
      links: [
        { label: 'XML Search Engine Sitemap (sitemap.xml)', href: '/sitemap.xml', desc: 'Raw XML index feed for search engine webmasters & Googlebot' },
        { label: 'Privacy Policy', href: '/policies/privacy', desc: 'Data handling, talent privacy, and protection terms' },
        { label: 'Terms of Service', href: '/policies/terms', desc: 'Platform terms and engagement agreements' },
        { label: 'Cookie Policy', href: '/policies/cookie-policy', desc: 'Cookie usage and tracking preferences' },
        { label: 'Trust & Security', href: '/policies/grievance', desc: 'ISO compliance and grievance redressal' }
      ]
    }
  ];

  return (
    <>
      <Header onOpenLeadModal={() => setIsLeadModalOpen(true)} />

      {/* Hero Section matching standard site subpages design */}
      <section className={styles.heroSection}>
        <div className={styles.heroRingWrapper}>
          <div className={styles.heroRing} />
        </div>

        <div className={styles.heroInner}>
          <div className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>Home</Link> / Platform Sitemap
          </div>

          <span className={styles.eyebrow}>DIRECTORY & INDEX</span>
          <h1 className={styles.heroTitle}>Scrizians Platform Sitemap</h1>
          <p className={styles.heroSub}>
            Complete visual navigation directory of all public pages, talent categories, solutions, company profiles, careers, and legal policies.
          </p>
        </div>
      </section>

      {/* Main Sitemap Grid Section */}
      <section className={styles.sitemapSection}>
        <div className={styles.sitemapInner}>
          <div className={styles.categoriesGrid}>
            {sitemapCategories.map((cat, idx) => (
              <div key={idx} className={styles.categoryCard}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardIcon}>{cat.icon}</span>
                  <h3 className={styles.cardTitle}>{cat.categoryTitle}</h3>
                </div>

                <ul className={styles.linksList}>
                  {cat.links.map((link, lIdx) => (
                    <li key={lIdx} className={styles.linkItem}>
                      <Link href={link.href} className={styles.sitemapLink}>
                        <span className={styles.linkLabel}>{link.label}</span>
                        <span className={styles.linkArrow}>→</span>
                      </Link>
                      <p className={styles.linkDesc}>{link.desc}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className={styles.bottomCtaSection}>
        <div className={styles.bottomCtaInner}>
          <h2>Looking for Specific Tech Talent?</h2>
          <p>Talk to our technical talent advisors to get curated developer profiles within 24 hours.</p>
          <button className={styles.btnPrimaryCta} onClick={() => setIsLeadModalOpen(true)}>
            Request Talent Consultation →
          </button>
        </div>
      </section>

      <LeadModal isOpen={isLeadModalOpen} onClose={() => setIsLeadModalOpen(false)} />
      <Footer />
    </>
  );
}
