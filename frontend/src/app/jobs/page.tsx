'use client';

import { jobApi } from '@/lib/expressApi';
import { adaptJob } from '@/lib/adapters';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { LeadModal } from '@/components/LeadModal/LeadModal';
import { Pagination } from '@/components/Pagination/Pagination';
import { useCurrency } from '@/context/CurrencyContext';
import { getStoredData, syncFromMongoDB, initialJobsList } from '@/utils/dataSync';
import styles from './Jobs.module.css';

export default function JobsPage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const { currency, toggleCurrency } = useCurrency();
  const [dynamicJobs, setDynamicJobs] = useState<any[]>(initialJobsList);

  React.useEffect(() => {
    jobApi.getAll('limit=100').then(res => {
      if (res.success && Array.isArray(res.data)) {
        const list = res.data.map(adaptJob);
        setDynamicJobs(list);
        localStorage.setItem('scrizians_jobs_list', JSON.stringify(list));
      }
    });
  }, []);

  const filteredJobs = useMemo(() => {
    const source = dynamicJobs.map(j => ({
      id: j.id,
      slug: j.slug || `job-${j.id}`,
      dept: j.dept || 'ENGINEERING',
      typeBadge: j.typeBadge || 'Full Time',
      typeKey: j.typeKey || 'Full-time',
      title: j.title,
      location: j.location || 'Remote (India / Global)',
      experience: j.experience || '3+ years',
      skills: Array.isArray(j.skills) ? j.skills : String(j.skills || 'React, Node.js').split(','),
      salaryUSD: j.rate || j.salaryUSD || '$25k – $40k',
      salaryINR: j.salaryINR || '₹18,00,000 – ₹30,00,000'
    }));

    if (activeFilter === 'All') return source;
    return source.filter(job => job.typeKey === activeFilter || job.typeBadge === activeFilter);
  }, [activeFilter, dynamicJobs]);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / ITEMS_PER_PAGE));
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <>
      <Header onOpenLeadModal={() => setIsLeadModalOpen(true)} />

      {/* Hero Section matching media_1790940232943.png */}
      <section className={styles.hero}>
        <div className={styles.heroRingWrapper}>
          <div className={styles.heroRing} />
        </div>

        <div className={styles.heroInner}>
          <div className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>Home</Link> / Jobs
          </div>

          <span className={styles.eyebrow}>JOBS & CAREERS</span>
          <h1 className={styles.title}>Build a global tech career with Scrizians</h1>
          <p className={styles.subtitle}>
            Work on international products from India. Apply in minutes — no account needed.
          </p>
        </div>
      </section>

      {/* Filter Bar & Jobs Grid matching media_1790940254514.png */}
      <main className={styles.mainContainer}>
        <div className={styles.filterBarRow}>
          <div className={styles.filterCapsules}>
            {['All', 'Full-time', 'Part-time', 'Contract', 'Internship'].map(filter => (
              <button
                key={filter}
                onClick={() => { setActiveFilter(filter); setCurrentPage(1); }}
                className={`${styles.capsuleBtn} ${activeFilter === filter ? styles.capsuleBtnActive : ''}`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className={styles.currencyToggle}>
            <button 
              className={`${styles.currBtn} ${currency === 'USD' ? styles.currBtnActive : ''}`}
              onClick={() => toggleCurrency('USD')}
            >
              $ USD
            </button>
            <button 
              className={`${styles.currBtn} ${currency === 'INR' ? styles.currBtnActive : ''}`}
              onClick={() => toggleCurrency('INR')}
            >
              ₹ INR
            </button>
          </div>
        </div>

        <div className={styles.counterLabel}>
          {filteredJobs.length} open positions
        </div>

        <div className={styles.jobsGrid}>
          {paginatedJobs.map(job => (
            <div key={job.id} className={styles.jobCard}>
              <div>
                <div className={styles.cardHeader}>
                  <span className={styles.deptName}>{job.dept}</span>
                  <span className={styles.typeBadge}>{job.typeBadge}</span>
                </div>

                <h2 className={styles.jobTitle}>{job.title}</h2>

                <div className={styles.metaRow}>
                  <span>📍 {job.location}</span>
                  <span>💼 {job.experience}</span>
                </div>

                <div className={styles.skillsRow}>
                  {job.skills.map((skill, idx) => (
                    <span key={idx} className={styles.skillChip}>{skill}</span>
                  ))}
                </div>
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.salaryText}>
                  {currency === 'USD' ? job.salaryUSD : job.salaryINR}
                </span>

                <Link href={`/jobs/${job.slug}`} className={styles.applyLink}>
                  Apply →
                </Link>
              </div>
            </div>
          ))}
        </div>

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredJobs.length}
          itemsPerPage={ITEMS_PER_PAGE}
          itemLabel="job openings"
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
