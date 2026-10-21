'use client';

import { articleApi } from '@/lib/expressApi';
import { adaptArticle } from '@/lib/adapters';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { LeadModal } from '@/components/LeadModal/LeadModal';
import { Pagination } from '@/components/Pagination/Pagination';
import { getStoredData, syncFromMongoDB, initialArticlesList } from '@/utils/dataSync';
import styles from './Insights.module.css';

export default function InsightsPage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [dynamicInsights, setDynamicInsights] = useState<any[]>([]);
  const ITEMS_PER_PAGE = 6;

  React.useEffect(() => {
    articleApi.getAll().then(res => {
      if (res.success && Array.isArray(res.data)) {
        const list = res.data.map(adaptArticle);
        setDynamicInsights(list);
        localStorage.setItem('scrizians_insights_list', JSON.stringify(list));
      }
    });
  }, []);

  const filteredArticles = useMemo(() => {
    const source = dynamicInsights.map(a => ({
      id: a.id,
      cat: String(a.category || a.cat || 'HIRING GUIDES').toUpperCase(),
      filterKey: a.category || a.filterKey || 'Hiring Guides',
      title: a.title,
      excerpt: a.excerpt || `Deep dive guide on ${a.title} written for engineering leaders and hiring managers.`,
      meta: `${a.author || 'Scrizians Editorial'} · ${a.publishedDate || '02 Oct 2026'} · ${a.readTime || '6 min read'}`,
      image: a.coverImageUrl || a.image || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=70'
    }));

    if (activeFilter === 'All') return source;
    return source.filter(item => item.filterKey === activeFilter || item.cat === activeFilter.toUpperCase());
  }, [activeFilter, dynamicInsights]);

  const showFeaturedHeader = activeFilter === 'All' && currentPage === 1;
  const featuredCard = filteredArticles[0];
  const secondaryCard = filteredArticles[1];

  const gridArticles = useMemo(() => {
    if (showFeaturedHeader) {
      return filteredArticles.slice(2, 2 + ITEMS_PER_PAGE);
    }
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredArticles.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredArticles, showFeaturedHeader, currentPage]);

  const totalPages = Math.max(1, Math.ceil(
    showFeaturedHeader 
      ? Math.max(0, filteredArticles.length - 2) / ITEMS_PER_PAGE 
      : filteredArticles.length / ITEMS_PER_PAGE
  ));

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  return (
    <>
      <Header onOpenLeadModal={() => setIsLeadModalOpen(true)} />

      {/* Hero Section matching media_1790940284262.png */}
      <section className={styles.hero}>
        <div className={styles.heroRingWrapper}>
          <div className={styles.heroRing} />
        </div>

        <div className={styles.heroInner}>
          <div className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>Home</Link> / Insights
          </div>

          <span className={styles.eyebrow}>INSIGHTS</span>
          <h1 className={styles.title}>Knowledge for hiring managers & engineers</h1>
          <p className={styles.subtitle}>
            Expert-reviewed guides from the Scrizians community.
          </p>

          <Link href="/register?role=contributor" className={styles.btnWrite}>
            Write for Scrizians
          </Link>
        </div>
      </section>

      {/* Articles & Filter Bar matching media_1790940303318.png */}
      <main className={styles.mainContainer}>
        {/* Filter Pills */}
        <div className={styles.filterCapsules}>
          {['All', 'Hiring Guides', 'Engagement Models', 'Interview Resources', 'Technical Guides', 'Salary & Careers'].map(filter => (
            <button
              key={filter}
              onClick={() => handleFilterChange(filter)}
              className={`${styles.capsuleBtn} ${activeFilter === filter ? styles.capsuleBtnActive : ''}`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Top Featured Section (Shown only on Page 1 when filter is 'All') */}
        {showFeaturedHeader && featuredCard && (
          <div className={styles.topSection}>
            <Link href={`/insights/${featuredCard.id}`} className={styles.featuredBigCard}>
              <div 
                className={styles.articleMediaBig} 
                style={{ backgroundImage: `url('${featuredCard.image}')` }}
              />
              <div className={styles.articleBody}>
                <div>
                  <span className={styles.articleCatRed}>{featuredCard.cat}</span>
                  <h2 className={styles.articleTitle} style={{ fontSize: '1.5rem' }}>{featuredCard.title}</h2>
                  <p className={styles.articleExcerpt}>{featuredCard.excerpt}</p>
                </div>
                <div className={styles.articleMeta}>{featuredCard.meta}</div>
              </div>
            </Link>

            {secondaryCard && (
              <Link href={`/insights/${secondaryCard.id}`} className={styles.articleCard}>
                <div 
                  className={styles.articleMedia} 
                  style={{ backgroundImage: `url('${secondaryCard.image}')` }}
                />
                <div className={styles.articleBody}>
                  <div>
                    <span className={styles.articleCatRed}>{secondaryCard.cat}</span>
                    <h3 className={styles.articleTitle}>{secondaryCard.title}</h3>
                    <p className={styles.articleExcerpt}>{secondaryCard.excerpt}</p>
                  </div>
                  <div className={styles.articleMeta}>{secondaryCard.meta}</div>
                </div>
              </Link>
            )}
          </div>
        )}

        {/* 3-Column Grid for Articles */}
        <div className={styles.insightsGrid3}>
          {gridArticles.map(article => (
            <Link key={article.id} href={`/insights/${article.id}`} className={styles.articleCard}>
              <div 
                className={styles.articleMedia} 
                style={{ backgroundImage: `url('${article.image}')` }}
              />
              <div className={styles.articleBody}>
                <div>
                  <span className={styles.articleCatRed}>{article.cat}</span>
                  <h3 className={styles.articleTitle}>{article.title}</h3>
                  <p className={styles.articleExcerpt}>{article.excerpt}</p>
                </div>
                <div className={styles.articleMeta}>{article.meta}</div>
              </div>
            </Link>
          ))}
        </div>

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={filteredArticles.length}
          itemsPerPage={ITEMS_PER_PAGE}
          itemLabel="articles"
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
