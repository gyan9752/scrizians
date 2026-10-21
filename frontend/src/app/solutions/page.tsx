'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { LeadModal } from '@/components/LeadModal/LeadModal';
import { useCurrency } from '@/context/CurrencyContext';
import styles from './Solutions.module.css';

const solutionsList = [
  {
    num: '01',
    id: 'staff-augmentation',
    title: 'Staff Augmentation',
    description: 'Extend your in-house team with pre-vetted Scrizians who plug into your workflows within days.',
    checklist: [
      'Scale up or down monthly',
      'You manage day-to-day work',
      'Replacement guarantee'
    ],
    idealFor: 'Ideal for: Product teams with short-term capacity gaps',
    priceUSD: 2400,
    priceINR: 190000,
    unit: 'mo' as const,
    displayUSD: '$2.4k/month'
  },
  {
    num: '02',
    id: 'dedicated-developers',
    title: 'Dedicated Developers',
    description: 'Full-time developers working exclusively on your product, in your timezone overlap.',
    checklist: [
      '160 hrs/month commitment',
      'Direct communication',
      'Long-term continuity'
    ],
    idealFor: 'Ideal for: Startups building core product',
    priceUSD: 2800,
    priceINR: 220000,
    unit: 'mo' as const,
    displayUSD: '$2.8k/month'
  },
  {
    num: '03',
    id: 'dedicated-team',
    title: 'Dedicated Team',
    description: 'A cross-functional pod — PM, developers, QA and DevOps — managed by Scriza.',
    checklist: [
      'Delivery manager included',
      'Sprint-based delivery',
      'Shared KPIs'
    ],
    idealFor: 'Ideal for: Companies launching new products',
    priceUSD: 9500,
    priceINR: 750000,
    unit: 'mo' as const,
    displayUSD: '$9.5k/month'
  },
  {
    num: '04',
    id: 'offshore-team',
    title: 'Offshore Team',
    description: 'A managed offshore delivery center in India operated end-to-end by Scriza.',
    checklist: [
      'Infrastructure & HR handled',
      'Process & security compliance',
      'Build-operate-transfer option'
    ],
    idealFor: 'Ideal for: Enterprises scaling engineering capacity',
    priceUSD: 15000,
    priceINR: 1200000,
    unit: 'mo' as const,
    displayUSD: '$15k/month'
  },
  {
    num: '05',
    id: 'remote-team',
    title: 'Remote Team',
    description: 'Timezone-aligned remote professionals on flexible hourly or monthly plans.',
    checklist: [
      'Hourly or monthly billing',
      'US/UK/EU hour overlap',
      'Fast onboarding'
    ],
    idealFor: 'Ideal for: Agencies and flexible project work',
    priceUSD: 20,
    priceINR: 1500,
    unit: 'hr' as const,
    displayUSD: '$20/hour'
  }
];

export default function SolutionsPage() {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [prefilledService, setPrefilledService] = useState<string | undefined>(undefined);
  const { currency, formatPrice } = useCurrency();

  const handleOpenLeadModal = (serviceName?: string) => {
    setPrefilledService(serviceName);
    setIsLeadModalOpen(true);
  };

  return (
    <>
      <Header onOpenLeadModal={() => handleOpenLeadModal()} />

      {/* Hero Section matching media_1790940076678.png */}
      <section className={styles.hero}>
        <div className={styles.heroRingWrapper}>
          <div className={styles.heroRing} />
        </div>

        <div className={styles.heroInner}>
          <div className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>Home</Link> / Solutions
          </div>

          <span className={styles.eyebrow}>SOLUTIONS</span>
          <h1 className={styles.title}>Engagement models built for global teams</h1>
          <p className={styles.subtitle}>
            Choose how you want to work with Scrizians — from a single developer to a fully managed offshore center.
          </p>
        </div>
      </section>

      {/* Main List of 5 Engagement Models matching media_1790940092342.png */}
      <main className={styles.mainContainer}>
        <div className={styles.cardsList}>
          {solutionsList.map(model => (
            <div key={model.id} id={model.id} className={styles.modelCard}>
              <div className={styles.cardLeft}>
                <span className={styles.numRed}>{model.num}</span>
                <div className={styles.cardContent}>
                  <h2 className={styles.modelTitle}>{model.title}</h2>
                  <p className={styles.modelDesc}>{model.description}</p>

                  <div className={styles.checklistGrid}>
                    {model.checklist.map((item, idx) => (
                      <div key={idx} className={styles.checkItem}>
                        <span className={styles.checkIcon}>✓</span> {item}
                      </div>
                    ))}
                  </div>

                  <span className={styles.idealPill}>{model.idealFor}</span>
                </div>
              </div>

              <div className={styles.cardRight}>
                <span className={styles.startingLabel}>STARTING FROM</span>
                <div className={styles.priceVal}>
                  {currency === 'USD' ? model.displayUSD : formatPrice(model.priceUSD, model.priceINR, model.unit)}
                </div>
                <button 
                  className={styles.btnQuote}
                  onClick={() => handleOpenLeadModal(model.title)}
                >
                  Get a quote
                </button>
              </div>
            </div>
          ))}
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
              onClick={() => handleOpenLeadModal()}
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
        prefilledRequirement={prefilledService ? `Inquiry regarding ${prefilledService} model` : undefined}
      />

      <Footer />
    </>
  );
}
