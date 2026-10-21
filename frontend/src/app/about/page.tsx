'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { LeadModal } from '@/components/LeadModal/LeadModal';
import styles from './About.module.css';

export default function AboutPage() {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  const orgJsonLd = {
    "@context": "https://schema.org/",
    "@type": "Organization",
    "name": "Scrizians",
    "legalName": "Scriza Private Limited",
    "url": "https://scrizians.com",
    "logo": "https://scrizians.com/images/logo-dark.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91 91191 12999",
      "contactType": "customer service",
      "areaServed": ["IN", "US", "GB", "AE", "GLOBAL"],
      "availableLanguage": "English"
    }
  };

  return (
    <>
      <Header onOpenLeadModal={() => setIsLeadModalOpen(true)} />

      {/* Inject Google Organization JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />

      {/* Hero Section matching media_1790940384947.png */}
      <section className={styles.hero}>
        <div className={styles.heroRingWrapper}>
          <div className={styles.heroRing} />
        </div>

        <div className={styles.heroInner}>
          <div className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>Home</Link> / About
          </div>

          <span className={styles.eyebrow}>ABOUT US</span>
          <h1 className={styles.title}>Connecting India's best tech talent with the world</h1>
          <p className={styles.subtitle}>
            Scrizians is a brand of Scriza Private Limited — a global technology talent, careers and knowledge platform.
          </p>
        </div>
      </section>

      {/* Story & Metrics Section matching media_1790940384947.png */}
      <main className={styles.mainContainer}>
        <div className={styles.storySection}>
          <div className={styles.storyContent}>
            <span className={styles.sectionEyebrow}>OUR STORY</span>
            <h2 className={styles.storyTitle}>Talent. Technology. Together.</h2>
            <p className={styles.storyText}>
              Scrizians was created to solve two problems at once: international companies struggle to find reliable, verified tech professionals, and talented engineers in India struggle to reach global opportunities without losing control of their identity and career.
            </p>
            <p className={styles.storyText}>
              Our platform combines a curated Talent Network, a careers portal, a knowledge community and a full operations backend run by the Scriza team — so every engagement is safe, transparent and outcome-driven.
            </p>
          </div>

          <div className={styles.statsBox}>
            <div className={styles.statCell}>
              <span className={styles.statNumRed}>10</span>
              <span className={styles.statLabel}>Verified Scrizians</span>
            </div>
            <div className={styles.statCell}>
              <span className={styles.statNumRed}>6</span>
              <span className={styles.statLabel}>Open roles</span>
            </div>
            <div className={styles.statCell}>
              <span className={styles.statNumRed}>4</span>
              <span className={styles.statLabel}>Case studies</span>
            </div>
            <div className={styles.statCell}>
              <span className={styles.statNumRed}>5</span>
              <span className={styles.statLabel}>Published insights</span>
            </div>
          </div>
        </div>

        {/* 4 Core Values Columns matching media_1790940384947.png */}
        <div className={styles.valuesGrid4}>
          <div className={styles.valueCol}>
            <span className={styles.numRed}>01</span>
            <h3 className={styles.valueTitle}>Talent first</h3>
            <p className={styles.valueText}>
              We protect our professionals' privacy and represent them fairly to global clients.
            </p>
          </div>

          <div className={styles.valueCol}>
            <span className={styles.numRed}>02</span>
            <h3 className={styles.valueTitle}>Quality over volume</h3>
            <p className={styles.valueText}>
              Curated, verified profiles instead of endless resume databases.
            </p>
          </div>

          <div className={styles.valueCol}>
            <span className={styles.numRed}>03</span>
            <h3 className={styles.valueTitle}>Transparent engagements</h3>
            <p className={styles.valueText}>
              Clear USD and INR pricing, contracts and accountability.
            </p>
          </div>

          <div className={styles.valueCol}>
            <span className={styles.numRed}>04</span>
            <h3 className={styles.valueTitle}>Knowledge shared</h3>
            <p className={styles.valueText}>
              A community that publishes and learns together.
            </p>
          </div>
        </div>
      </main>

      {/* Red CTA Band */}
      <section style={{ 
        backgroundColor: '#E52B2B', 
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(0,0,0,0.06) 12px, rgba(0,0,0,0.06) 24px)',
        color: '#ffffff',
        padding: '4rem 1.5rem'
      }}>
        <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.4rem' }}>Ready to build your team?</h2>
            <p style={{ fontSize: '1rem', color: '#ffffff', opacity: 0.9 }}>
              Share your requirement and receive a curated Scrizian shortlist within 48 hours.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => setIsLeadModalOpen(true)}
              style={{ background: '#0B172A', color: '#ffffff', padding: '0.85rem 1.8rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.95rem', border: 'none', cursor: 'pointer' }}
            >
              Hire Talent
            </button>
            <a 
              href="tel:+919119112999" 
              style={{ background: '#ffffff', color: '#0B172A', padding: '0.85rem 1.8rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', display: 'inline-block' }}
            >
              Call +91 91191 12999
            </a>
          </div>
        </div>
      </section>

      <LeadModal 
        isOpen={isLeadModalOpen} 
        onClose={() => setIsLeadModalOpen(false)} 
      />

      <Footer />
    </>
  );
}
