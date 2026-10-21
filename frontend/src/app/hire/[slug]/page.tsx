'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { LeadModal } from '@/components/LeadModal/LeadModal';
import styles from './LandingPage.module.css';

export default function SEOHireLandingPage({ params }: { params: { slug: string } }) {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  const titleFormatted = params.slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <>
      <Header onOpenLeadModal={() => setIsLeadModalOpen(true)} />

      <section className={styles.hero}>
        <h1 className={styles.title}>{titleFormatted} from India</h1>
        <p className={styles.subtitle}>
          Scale your technology team with pre-vetted, high-caliber Scrizian tech professionals backed by <strong>Scriza Private Limited</strong>.
        </p>
        <button className={styles.ctaBtn} onClick={() => setIsLeadModalOpen(true)}>
          Request Curated {titleFormatted} Profiles
        </button>
      </section>

      <div className={styles.container}>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--color-navy)', textAlign: 'center' }}>
          Why Hire {titleFormatted} via Scrizians
        </h2>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h3 style={{ color: 'var(--color-navy)', marginBottom: '0.5rem' }}>Top 3% Pre-Vetted Talent</h3>
            <p style={{ color: '#64748B', fontSize: '0.92rem' }}>Every engineer undergoes rigorous technical code reviews, architecture evaluations, and security vetting.</p>
          </div>
          <div className={styles.card}>
            <h3 style={{ color: 'var(--color-navy)', marginBottom: '0.5rem' }}>100% Privacy & NDA Protected</h3>
            <p style={{ color: '#64748B', fontSize: '0.92rem' }}>Personal details remain confidential under Scrizian ID protocols, managed directly by Scriza Private Limited.</p>
          </div>
          <div className={styles.card}>
            <h3 style={{ color: 'var(--color-navy)', marginBottom: '0.5rem' }}>Timezone-Aware Overlap</h3>
            <p style={{ color: '#64748B', fontSize: '0.92rem' }}>Engineers available with dedicated EST, PST, GMT, or IST working hours for frictionless daily agile standups.</p>
          </div>
        </div>
      </div>

      <LeadModal 
        isOpen={isLeadModalOpen} 
        onClose={() => setIsLeadModalOpen(false)} 
      />

      <Footer />
    </>
  );
}
