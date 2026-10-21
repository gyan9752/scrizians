'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { LeadModal } from '@/components/LeadModal/LeadModal';
import { Pagination } from '@/components/Pagination/Pagination';
import { caseStudyApi } from '@/lib/expressApi';
import styles from './CaseStudies.module.css';

const initialCaseStudiesList = [
  {
    id: 'uk-health-tech-app-launched-in-14-weeks',
    tag: 'Healthcare · United Kingdom',
    title: 'UK Health-Tech App Launched in 14 Weeks',
    description: 'Flutter + Laravel Scrizians delivered a HIPAA-aware patient app from scratch.',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=70',
    metrics: [
      { val: '14 wks', label: 'Launch' },
      { val: '4.7', label: 'Store rating' },
      { val: '99.6%', label: 'Crash-free' }
    ]
  },
  {
    id: 'uae-retailer-cuts-qa-cycle-from-5-days-to-6-hours',
    tag: 'Retail & E-commerce · UAE',
    title: 'UAE Retailer Cuts QA Cycle from 5 Days to 6 Hours',
    description: 'QA automation Scrizians built a Playwright regression suite across web and mobile.',
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=70',
    metrics: [
      { val: '-95%', label: 'Regression time' },
      { val: '82%', label: 'Test coverage' },
      { val: '-70%', label: 'Escaped bugs' }
    ]
  },
  {
    id: 'ai-support-assistant-for-a-european-saas',
    tag: 'SaaS · Germany',
    title: 'AI Support Assistant for a European SaaS',
    description: 'Data & AI Scrizians shipped an LLM assistant resolving 40% of tickets automatically.',
    image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=70',
    metrics: [
      { val: '40%', label: 'Ticket deflection' },
      { val: '-35%', label: 'First response' },
      { val: '6', label: 'Languages' }
    ]
  },
  {
    id: 'scaling-a-us-fintech-platform-with-a-dedicated-team',
    tag: 'Fintech · United States',
    title: 'Scaling a US Fintech Platform with a Dedicated Team',
    description: "A 9-member dedicated Scrizians team rebuilt a lending platform's core in 5 months.",
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=70',
    metrics: [
      { val: '4x', label: 'Release frequency' },
      { val: '-60%', label: 'Incidents' },
      { val: '9 days', label: 'Time to hire' }
    ]
  }
];

export default function CaseStudiesPage() {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [caseStudies, setCaseStudies] = useState<any[]>(initialCaseStudiesList);
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    caseStudyApi.getAll().then(res => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const formatted = res.data.map((c: any) => ({
          id: c.slug || c._id,
          tag: `${c.category || 'Engineering'} · ${c.region || 'Global'}`,
          title: c.title,
          description: c.summary || c.challenge || 'Scrizians engineering delivery case study.',
          image: c.heroImage || c.coverImage || 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=70',
          metrics: Array.isArray(c.metrics) ? c.metrics : [
            { val: c.deliveryTime || '12 wks', label: 'Delivery' },
            { val: '100%', label: 'SLA' }
          ]
        }));
        setCaseStudies(formatted);
      }
    });
  }, []);
  const ITEMS_PER_PAGE = 4;

  const totalPages = Math.max(1, Math.ceil(caseStudies.length / ITEMS_PER_PAGE));
  const paginatedList = caseStudies.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <>
      <Header onOpenLeadModal={() => setIsLeadModalOpen(true)} />

      {/* Hero Section matching media_1790940186494.png */}
      <section className={styles.hero}>
        <div className={styles.heroRingWrapper}>
          <div className={styles.heroRing} />
        </div>

        <div className={styles.heroInner}>
          <div className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>Home</Link> / Case Studies
          </div>

          <span className={styles.eyebrow}>CASE STUDIES</span>
          <h1 className={styles.title}>Measurable outcomes for global clients</h1>
          <p className={styles.subtitle}>
            Real engagements, real metrics — delivered by Scrizian teams across industries.
          </p>
        </div>
      </section>

      {/* 2-Column Case Studies Grid matching media_1790940201865.png */}
      <main className={styles.mainContainer}>
        <div className={styles.caseGrid2}>
          {paginatedList.map(item => (
            <Link key={item.id} href={`/case-studies/${item.id}`} className={styles.caseCard}>
              <div>
                <div 
                  className={styles.caseMedia} 
                  style={{ backgroundImage: `url('${item.image}')` }}
                >
                  <span className={styles.caseTagOverlay}>{item.tag}</span>
                </div>

                <div className={styles.caseBody}>
                  <h2 className={styles.caseTitle}>{item.title}</h2>
                  <p className={styles.caseDesc}>{item.description}</p>
                </div>
              </div>

              <div className={styles.caseBody} style={{ paddingTop: 0 }}>
                <div className={styles.metricsRow}>
                  {item.metrics.map((m, idx) => (
                    <div key={idx}>
                      <span className={styles.metricNumRed}>{m.val}</span>
                      <span className={styles.metricLabel}>{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={caseStudies.length}
          itemsPerPage={ITEMS_PER_PAGE}
          itemLabel="case studies"
        />
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
