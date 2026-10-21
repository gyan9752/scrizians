'use client';

import { talentApi } from '@/lib/expressApi';
import { adaptTalent } from '@/lib/adapters';
import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { TalentCard, Talent } from '@/components/TalentCard/TalentCard';
import { LeadModal } from '@/components/LeadModal/LeadModal';
import { Pagination } from '@/components/Pagination/Pagination';
import { getStoredData, syncFromMongoDB, initialTalentList } from '@/utils/dataSync';
import styles from './TalentDirectory.module.css';

function TalentNetworkContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || searchParams.get('search') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState('');
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedScrizianId, setSelectedScrizianId] = useState<string | undefined>(undefined);
  const [talentList, setTalentList] = useState<any[]>(initialTalentList);

  React.useEffect(() => {
    talentApi.getAll('limit=100').then(res => {
      if (res.success && Array.isArray(res.data)) {
        const list = res.data.map(adaptTalent);
        setTalentList(list);
        localStorage.setItem('scrizians_talent_list', JSON.stringify(list));
      }
    });
  }, []);

  const filteredTalents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const sourceList = talentList.map(t => ({
      scrizianId: t.id || t.scrizianId,
      displayName: t.displayName || t.name,
      title: t.title,
      category: t.category || 'Full Stack Developers',
      summary: t.summary || `${t.experienceYears || 7}+ years experience in ${t.skills || 'software development'}.`,
      experienceYears: t.experienceYears || 7,
      skills: Array.isArray(t.skills) ? t.skills : String(t.skills || '').split(',').map(s => s.trim()),
      availability: t.availability || 'Available now',
      hourlyRateUSD: Number(t.hourlyRateUSD || 35),
      monthlyRateINR: t.monthlyRateINR || 190000,
      relationshipBadge: t.relationshipBadge || (t.status === 'Verified' ? 'Verified Scrizian' : 'Available for Hire')
    }));

    return sourceList.filter(talent => {
      let matchesSearch = true;
      let matchesCategory = true;
      let matchesAvailability = true;

      if (q) {
        matchesSearch = (
          talent.title.toLowerCase().includes(q) ||
          talent.scrizianId.toLowerCase().includes(q) ||
          talent.skills.some(s => s.toLowerCase().includes(q)) ||
          Boolean(talent.category && talent.category.toLowerCase().includes(q))
        );
      }

      if (selectedCategory && selectedCategory !== 'All categories') {
        matchesCategory = talent.category === selectedCategory;
      }

      if (selectedAvailability && selectedAvailability !== 'Any availability') {
        matchesAvailability = talent.availability.toLowerCase() === selectedAvailability.toLowerCase();
      }

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [searchQuery, selectedCategory, selectedAvailability, talentList]);

  const handleOpenLeadModal = (scrizianId?: string) => {
    setSelectedScrizianId(scrizianId);
    setIsLeadModalOpen(true);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const totalPages = Math.max(1, Math.ceil(filteredTalents.length / ITEMS_PER_PAGE));
  const paginatedTalents = filteredTalents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <>
      <Header onOpenLeadModal={() => handleOpenLeadModal()} />

      <section className={styles.hero}>
        <div className={styles.heroRingWrapper}>
          <div className={styles.heroRing}></div>
        </div>
        <div className={styles.heroInner}>
          <div className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>Home</Link> / Talent Network
          </div>

          <span className={styles.eyebrow}>SCRIZIANS TALENT NETWORK</span>
          <h1 className={styles.title}>Discover verified tech professionals</h1>
          <p className={styles.subtitle}>
            Every profile is curated by Scriza. Identities are protected by Scrizian IDs — request interviews and our team arranges the rest.
          </p>

          <div className={styles.filterCard}>
            <div className={styles.searchWrapper}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search by skill, role or Scrizian ID"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <select
              className={styles.select}
              value={selectedCategory}
              onChange={e => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All categories</option>
              <option value="Frontend Developers">Frontend Developers</option>
              <option value="Backend Developers">Backend Developers</option>
              <option value="Full Stack Developers">Full Stack Developers</option>
              <option value="QA Engineers">QA Engineers</option>
              <option value="DevOps Engineers">DevOps Engineers</option>
              <option value="UI/UX Designers">UI/UX Designers</option>
              <option value="Mobile Developers">Mobile Developers</option>
              <option value="Data & AI Specialists">Data & AI Specialists</option>
              <option value="SEO & Digital Talent">SEO & Digital Talent</option>
            </select>

            <select
              className={styles.select}
              value={selectedAvailability}
              onChange={e => { setSelectedAvailability(e.target.value); setCurrentPage(1); }}
            >
              <option value="">Any availability</option>
              <option value="Available now">Available now</option>
              <option value="Partially available">Partially available</option>
            </select>
          </div>
        </div>
      </section>

      <main className={styles.mainContainer}>
        <div className={styles.counterLabel}>
          {filteredTalents.length} Scrizians found
        </div>

        {filteredTalents.length > 0 ? (
          <>
            <div className={styles.grid}>
              {paginatedTalents.map(talent => (
                <TalentCard 
                  key={talent.scrizianId} 
                  talent={talent} 
                  onSelectLeadModal={(id) => handleOpenLeadModal(id)}
                />
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredTalents.length}
              itemsPerPage={ITEMS_PER_PAGE}
              itemLabel="Scrizians"
            />
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>No Scrizians found</h3>
            <p style={{ color: '#64748B', marginBottom: '1rem' }}>Try adjusting your search query or filter options.</p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory(''); setSelectedAvailability(''); setCurrentPage(1); }} 
              style={{ background: '#0B172A', color: '#ffffff', border: 'none', padding: '0.6rem 1.4rem', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
            >
              Clear filters
            </button>
          </div>
        )}
      </main>

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
        prefilledScrizianId={selectedScrizianId}
      />

      <Footer />
    </>
  );
}

export default function TalentNetworkPage() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>Loading Talent Network...</div>}>
      <TalentNetworkContent />
    </Suspense>
  );
}
