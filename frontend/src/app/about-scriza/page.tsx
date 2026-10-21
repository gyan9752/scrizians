'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { LeadModal } from '@/components/LeadModal/LeadModal';
import styles from './AboutScriza.module.css';

export default function AboutScrizaPage() {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  return (
    <>
      <Header onOpenLeadModal={() => setIsLeadModalOpen(true)} />

      {/* Hero Section matching standard subpages theme */}
      <section className={styles.heroSection}>
        <div className={styles.heroRingWrapper}>
          <div className={styles.heroRing} />
        </div>

        <div className={styles.heroInner}>
          <div className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>Home</Link> / About Scriza
          </div>

          <span className={styles.eyebrow}>PARENT ORGANIZATION</span>
          <h1 className={styles.heroTitle}>About Scriza Private Limited</h1>
          <p className={styles.heroSub}>
            Global technology & software engineering ecosystem backing the Scrizians Talent Network.
          </p>

          <a 
            href="https://www.scriza.in/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.btnScrizaSite}
          >
            Visit Official Website (scriza.in) ↗
          </a>
        </div>
      </section>

      {/* Corporate Overview & Relationship */}
      <section className={styles.overviewSection}>
        <div className={styles.overviewInner}>
          <div className={styles.gridTwo}>
            <div className={styles.textBlock}>
              <h2 className={styles.sectionHeading}>Enterprise Talent & Software Delivery</h2>
              <p>
                <strong>Scriza Private Limited</strong> is an Indian technology innovation and digital software enterprise headquartered in Noida / Delhi NCR, India. Scriza provides end-to-end IT services, enterprise software product engineering, cloud solutions, and technology consulting.
              </p>
              <p>
                <strong>Scrizians</strong> is the flagship global talent, careers, and knowledge platform powered and managed by Scriza Private Limited. It bridges international companies and scaling SaaS ventures with top-tier Indian engineering talent.
              </p>

              <div className={styles.corporateMetaCard}>
                <div className={styles.metaRow}>
                  <strong>Corporate Name:</strong> Scriza Private Limited
                </div>
                <div className={styles.metaRow}>
                  <strong>Official Website:</strong>{' '}
                  <a href="https://www.scriza.in/" target="_blank" rel="noopener noreferrer">
                    https://www.scriza.in/
                  </a>
                </div>
                <div className={styles.metaRow}>
                  <strong>Corporate Head Office:</strong> NX-ONE, Tech Zone IV, Greater Noida, Uttar Pradesh 201318, India
                </div>
                <div className={styles.metaRow}>
                  <strong>Global Helpline:</strong> +91 91191 12999
                </div>
              </div>
            </div>

            {/* Ecosystem Architecture Diagram */}
            <div className={styles.ecosystemCard}>
              <h3 className={styles.ecoTitle}>Scriza Ecosystem Architecture</h3>
              <p className={styles.ecoSub}>How Scriza backs the Scrizians platform:</p>

              <div className={styles.ecoFlow}>
                <div className={styles.ecoNodeParent}>
                  <strong>Scriza Private Limited</strong>
                  <span>Parent Technology Org</span>
                </div>
                <div className={styles.ecoArrow}>↓ Backs & Governs</div>
                <div className={styles.ecoNodeChild}>
                  <strong>Scrizians Platform</strong>
                  <span>Global Talent Network & Managed Delivery</span>
                </div>
                <div className={styles.ecoArrow}>↓ Delivers</div>
                <div className={styles.ecoNodeEnd}>
                  <strong>Clients & Talent</strong>
                  <span>Verified Engagements & Enterprise SLAs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values / Why Scriza */}
      <section className={styles.valuesSection}>
        <div className={styles.valuesInner}>
          <h2 className={styles.sectionHeadingCenter}>Why Companies Trust Scriza & Scrizians</h2>

          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <span className={styles.valueIcon}>🔒</span>
              <h4>Enterprise Governance</h4>
              <p>All client engagements are governed by legally binding NDAs, strict IP protection, and ISO-grade security standards.</p>
            </div>

            <div className={styles.valueCard}>
              <span className={styles.valueIcon}>⚡</span>
              <h4>Curated Quality Assurance</h4>
              <p>Talent profiles undergo technical screening, communication checks, and background verification before joining the network.</p>
            </div>

            <div className={styles.valueCard}>
              <span className={styles.valueIcon}>🌐</span>
              <h4>Global Timezone Alignment</h4>
              <p>Engineers work with seamless timezone overlap across US (EST/PST), Europe (GMT/CET), and APAC/Middle East timezones.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className={styles.bottomCtaSection}>
        <div className={styles.bottomCtaInner}>
          <h2>Partner with Scriza & Scrizians</h2>
          <p>Schedule a call with our enterprise delivery leaders to scale your technology teams.</p>
          <div className={styles.btnGroup}>
            <button className={styles.btnPrimaryCta} onClick={() => setIsLeadModalOpen(true)}>
              Schedule Consultation →
            </button>
            <a 
              href="https://www.scriza.in/" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.btnSecondaryCta}
            >
              Explore Scriza Corporate Site ↗
            </a>
          </div>
        </div>
      </section>

      <LeadModal isOpen={isLeadModalOpen} onClose={() => setIsLeadModalOpen(false)} />
      <Footer />
    </>
  );
}
