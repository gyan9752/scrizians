'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { LeadModal } from '@/components/LeadModal/LeadModal';
import { Pagination } from '@/components/Pagination/Pagination';
import styles from './Technologies.module.css';

const categoriesList = [
  {
    num: '01',
    title: 'Frontend',
    techs: [
      { name: 'React', link: '/hire-talent?tech=React' },
      { name: 'Next.js', link: '/hire-talent?tech=Next.js' },
      { name: 'Angular', link: '/hire-talent?tech=Angular' },
      { name: 'Vue.js', link: '/hire-talent?tech=Vue.js' },
      { name: 'TypeScript', link: '/hire-talent?tech=TypeScript' }
    ]
  },
  {
    num: '02',
    title: 'Backend',
    techs: [
      { name: 'Node.js', link: '/hire-talent?tech=Node.js' },
      { name: 'Laravel', link: '/hire-talent?tech=Laravel' },
      { name: 'PHP', link: '/hire-talent?tech=PHP' },
      { name: 'Python', link: '/hire-talent?tech=Python' },
      { name: 'Java', link: '/hire-talent?tech=Java' },
      { name: '.NET', link: '/hire-talent?tech=.NET' }
    ]
  },
  {
    num: '03',
    title: 'Mobile',
    techs: [
      { name: 'Flutter', link: '/hire-talent?tech=Flutter' },
      { name: 'Android', link: '/hire-talent?tech=Android' },
      { name: 'iOS', link: '/hire-talent?tech=iOS' },
      { name: 'React Native', link: '/hire-talent?tech=React Native' }
    ]
  },
  {
    num: '04',
    title: 'Cloud & DevOps',
    techs: [
      { name: 'AWS', link: '/hire-talent?tech=AWS' },
      { name: 'GCP', link: '/hire-talent?tech=GCP' },
      { name: 'Azure', link: '/hire-talent?tech=Azure' },
      { name: 'Kubernetes', link: '/hire-talent?tech=Kubernetes' },
      { name: 'Terraform', link: '/hire-talent?tech=Terraform' }
    ]
  },
  {
    num: '05',
    title: 'Data & AI',
    techs: [
      { name: 'PyTorch', link: '/hire-talent?tech=PyTorch' },
      { name: 'LangChain', link: '/hire-talent?tech=LangChain' },
      { name: 'TensorFlow', link: '/hire-talent?tech=TensorFlow' },
      { name: 'Data Engineering', link: '/hire-talent?tech=Data Engineering' }
    ]
  },
  {
    num: '06',
    title: 'QA & Digital',
    techs: [
      { name: 'Playwright', link: '/hire-talent?tech=Playwright' },
      { name: 'Selenium', link: '/hire-talent?tech=Selenium' },
      { name: 'Cypress', link: '/hire-talent?tech=Cypress' },
      { name: 'Technical SEO', link: '/hire-talent?tech=Technical SEO' }
    ]
  }
];

export default function TechnologiesPage() {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 3;

  const totalPages = Math.max(1, Math.ceil(categoriesList.length / ITEMS_PER_PAGE));
  const paginatedCategories = categoriesList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <>
      <Header onOpenLeadModal={() => setIsLeadModalOpen(true)} />

      {/* Hero Section matching media_1790940127364.png */}
      <section className={styles.hero}>
        <div className={styles.heroRingWrapper}>
          <div className={styles.heroRing} />
        </div>

        <div className={styles.heroInner}>
          <div className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>Home</Link> / Technologies
          </div>

          <span className={styles.eyebrow}>TECHNOLOGIES</span>
          <h1 className={styles.title}>Deep expertise across the modern stack</h1>
          <p className={styles.subtitle}>
            Pick a technology to see matching Scrizians and engagement options.
          </p>
        </div>
      </section>

      {/* Categorized Tech Grid matching media_1790940148438.png */}
      <main className={styles.mainContainer}>
        <div className={styles.categoryRows}>
          {paginatedCategories.map(cat => (
            <div key={cat.num} className={styles.categoryRow}>
              <div className={styles.catLeft}>
                <span className={styles.numRed}>{cat.num}</span>
                <h2 className={styles.catTitle}>{cat.title}</h2>
              </div>

              <div className={styles.techCardsGrid}>
                {cat.techs.map(tech => (
                  <Link key={tech.name} href={tech.link} className={styles.techCard}>
                    <span className={styles.techName}>{tech.name}</span>
                    <span className={styles.hireLink}>
                      Hire {tech.name} experts →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={categoriesList.length}
          itemsPerPage={ITEMS_PER_PAGE}
          itemLabel="tech categories"
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
