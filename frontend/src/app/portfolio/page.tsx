'use client';

import { portfolioApi } from '@/lib/expressApi';
import { adaptPortfolio } from '@/lib/adapters';
import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { LeadModal } from '@/components/LeadModal/LeadModal';
import { Pagination } from '@/components/Pagination/Pagination';
import styles from './Portfolio.module.css';

export default function PortfolioPage() {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);

  React.useEffect(() => {
    portfolioApi.getPublic().then(res => {
      if (res.success && Array.isArray(res.data)) {
        const list = res.data.map(adaptPortfolio);
        setPortfolioItems(list);
        localStorage.setItem('scrizians_portfolio_list', JSON.stringify(list));
      }
    });
  }, []);

  return (
    <>
      <Header onOpenLeadModal={() => setIsLeadModalOpen(true)} />

      {/* Hero Section matching media_1790940423376.png */}
      <section className={styles.hero}>
        <div className={styles.heroRingWrapper}>
          <div className={styles.heroRing} />
        </div>

        <div className={styles.heroInner}>
          <div className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>Home</Link> / Portfolio
          </div>

          <span className={styles.eyebrow}>PORTFOLIO</span>
          <h1 className={styles.title}>Work shipped by Scrizians</h1>
          <p className={styles.subtitle}>
            Every project is reviewed for rights and confidentiality before publishing. NDA work is shown without client identity.
          </p>
        </div>
      </section>

      {/* Portfolio Grid Layout */}
      <main className={styles.mainContainer}>
        {(() => {
          const itemsToRender = portfolioItems.length > 0 ? portfolioItems : [];
          const ITEMS_PER_PAGE = 6;
          const totalPages = Math.max(1, Math.ceil(itemsToRender.length / ITEMS_PER_PAGE));
          const currentItems = itemsToRender.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

          // Chunk items into pairs of 2
          const pairs: any[][] = [];
          for (let i = 0; i < currentItems.length; i += 2) {
            pairs.push(currentItems.slice(i, i + 2));
          }

          const renderCard = (item: any, isBig = false) => {
            const cardMediaClass = isBig ? styles.cardMediaBig : styles.cardMedia;
            const projectLink = `/portfolio/${item.slug || item.id}`;
            const skillsList = Array.isArray(item.skills) ? item.skills : (Array.isArray(item.techStack) ? item.techStack : []);

            return (
              <div className={styles.portfolioCard} key={item.id || item.slug}>
                <div 
                  className={cardMediaClass} 
                  style={{ backgroundImage: `url('${item.imageUrl || (item.media && item.media[0]?.url) || 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=70'}')` }}
                >
                  {item.ndaProtected && <span className={styles.ndaBadge}>🔒 NDA Protected</span>}
                </div>
                <div className={styles.cardBody}>
                  <div>
                    <span className={styles.authorTagRed}>
                      by {item.scrizianId || 'SCR-8841'} · {item.authorRole || 'Technical Specialist'}
                    </span>
                    <h2 className={styles.projectTitle}>
                      <Link href={projectLink} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {item.title} →
                      </Link>
                    </h2>
                    <p className={styles.projectSub}>{item.summary}</p>
                  </div>
                  {skillsList.length > 0 && (
                    <div className={styles.skillsRow}>
                      {skillsList.slice(0, 3).map((skill: string, sIdx: number) => (
                        <span key={sIdx} className={styles.skillChip}>{skill}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          };

          return (
            <>
              {pairs.map((pair, pIdx) => {
                // alternate row style: 0 -> asymmLeft, 1 -> equi, 2 -> asymmRight
                const rowPattern = pIdx % 3;
                let rowClass = styles.rowEqui;
                let firstBig = false;
                let secondBig = false;

                if (rowPattern === 0) {
                  rowClass = styles.rowAsymmLeft;
                  firstBig = true;
                } else if (rowPattern === 2) {
                  rowClass = styles.rowAsymmRight;
                  secondBig = true;
                }

                return (
                  <div key={pIdx} className={rowClass}>
                    {renderCard(pair[0], firstBig)}
                    {pair[1] && renderCard(pair[1], secondBig)}
                  </div>
                );
              })}

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={itemsToRender.length}
                itemsPerPage={ITEMS_PER_PAGE}
                itemLabel="portfolio projects"
              />
            </>
          );
        })()}
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
