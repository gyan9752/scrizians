'use client';

import { talentApi } from '@/lib/expressApi';
import { adaptTalent } from '@/lib/adapters';
import { syncFromMongoDB } from '@/utils/dataSync';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { LeadModal } from '@/components/LeadModal/LeadModal';
import { useCurrency } from '@/context/CurrencyContext';
import styles from './TalentProfileDetail.module.css';

const talentLookupMap: Record<string, any> = {
  'SCR-8841': {
    scrizianId: 'SCR-8841',
    displayName: 'Aarav M.',
    title: 'Lead Full-Stack Architect',
    category: 'Full Stack Developers',
    summary: 'Architects scalable SaaS platforms end to end, from API design to cloud deployment. Led 12+ product teams across fintech and healthtech.',
    experienceYears: 9,
    skills: ['Next.js', 'Node.js', 'Python', 'AWS', 'MongoDB'],
    availability: 'Available now',
    hourlyRateUSD: 42,
    monthlyRateINR: 240000,
    relationshipBadge: 'Scriza Team Member',
    location: 'India',
    timezone: 'IST (UTC+5:30)',
    portfolio: {
      title: 'Lending Platform Re-architecture',
      isNDA: true,
      description: 'Microservices migration for a US lending platform.',
      roles: 'Lead Architect · Node.js, AWS, Kafka'
    }
  },
  'SCR-6648': {
    scrizianId: 'SCR-6648',
    displayName: 'Priya K.',
    title: 'Java & Spring Boot Engineer',
    category: 'Backend Developers',
    summary: '8+ years building high-throughput banking APIs, microservices and Kafka event streams.',
    experienceYears: 8,
    skills: ['Java', 'Spring Boot', 'Microservices', 'Kafka'],
    availability: 'Available now',
    hourlyRateUSD: 36,
    monthlyRateINR: 200000,
    relationshipBadge: 'Verified Scrizian',
    location: 'India',
    timezone: 'IST (UTC+5:30)',
    portfolio: {
      title: 'Banking Event Stream Engine',
      isNDA: true,
      description: 'High-frequency transaction streaming engine for regional bank.',
      roles: 'Senior Engineer · Java, Kafka, Spring'
    }
  },
  'SCR-3928': {
    scrizianId: 'SCR-3928',
    displayName: 'Ananya S.',
    title: 'Principal UI/UX Product Designer',
    category: 'UI/UX Designers',
    summary: '8+ years creating design systems, complex SaaS dashboards and B2B user journeys in Figma.',
    experienceYears: 8,
    skills: ['Figma', 'Design Systems', 'Prototyping', 'User Research'],
    availability: 'Partially available',
    hourlyRateUSD: 35,
    monthlyRateINR: 190000,
    relationshipBadge: 'Verified Scrizian',
    location: 'India',
    timezone: 'IST (UTC+5:30)',
    portfolio: {
      title: 'Enterprise Design System Redesign',
      isNDA: true,
      description: 'Unified multi-brand design system across 4 SaaS products.',
      roles: 'Lead Designer · Figma, Design Tokens'
    }
  },
  'SCR-6102': {
    scrizianId: 'SCR-6102',
    displayName: 'Rohan V.',
    title: 'Senior Cloud & DevOps Engineer',
    category: 'DevOps Engineers',
    summary: '7+ years deploying multi-region Kubernetes clusters, Terraform IaC, and GCP/AWS pipelines.',
    experienceYears: 7,
    skills: ['Kubernetes', 'Terraform', 'GCP', 'AWS', 'CI/CD'],
    availability: 'Available now',
    hourlyRateUSD: 38,
    monthlyRateINR: 210000,
    relationshipBadge: 'Verified Scrizian',
    location: 'India',
    timezone: 'IST (UTC+5:30)',
    portfolio: {
      title: 'Multi-Region K8s Cluster Migration',
      isNDA: true,
      description: 'Zero-downtime infrastructure migration to GCP.',
      roles: 'DevOps Lead · Terraform, K8s, GCP'
    }
  }
};

import { getStoredData, initialTalentList } from '@/utils/dataSync';

export default function TalentProfileDetailPage({ params }: { params: { id: string } }) {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const { formatPrice } = useCurrency();

  const [talentList, setTalentList] = useState<any[]>([]);

  useEffect(() => {
    const refreshData = () => {
      setTalentList(getStoredData('scrizians_talent_list', initialTalentList));
    };
    refreshData();
    syncFromMongoDB('scrizians_talent_list');
    talentApi.getByScrizianId(params.id).then(res => {
      if (res.success && res.data) {
        const profile = adaptTalent(res.data);
        const current = getStoredData('scrizians_talent_list', initialTalentList);
        const merged = [profile, ...current.filter((t: any) => String(t.id || t.scrizianId) !== String(profile.id))];
        setTalentList(merged);
      }
    });
    window.addEventListener('scrizians_storage_updated', refreshData);
    window.addEventListener('storage', refreshData);
    return () => {
      window.removeEventListener('scrizians_storage_updated', refreshData);
      window.removeEventListener('storage', refreshData);
    };
  }, []);

  const found = talentList.find((t: any) => 
    String(t.id || t.scrizianId).toLowerCase() === String(params.id).toLowerCase()
  ) || talentLookupMap[params.id.toUpperCase()] || talentLookupMap['SCR-8841'];

  if (!found) {
    return (
      <>
        <Header onOpenLeadModal={() => setIsLeadModalOpen(true)} />
        <section style={{ backgroundColor: '#0A172A', color: '#ffffff', padding: '5rem 1.5rem', textAlign: 'center' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Scrizian Profile No Longer Available</h1>
            <p style={{ color: '#94A3B8', marginBottom: '2rem' }}>This talent profile has been removed or updated by the administrator.</p>
            <Link href="/talent" style={{ display: 'inline-block', backgroundColor: '#DC2626', color: '#ffffff', padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 600, textDecoration: 'none' }}>
              Explore Verified Talent Network →
            </Link>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  const activeProfile = {
    scrizianId: found.id || found.scrizianId,
    displayName: found.displayName || found.name || 'Verified Scrizian',
    title: found.title,
    category: found.category || 'Full Stack Developers',
    summary: found.summary || `${found.experienceYears || 7}+ years experience in ${found.skills || 'software development'}.`,
    experienceYears: found.experienceYears || 7,
    skills: Array.isArray(found.skills) ? found.skills : String(found.skills || '').split(',').map((s: string) => s.trim()),
    availability: found.availability || 'Available now',
    hourlyRateUSD: Number(found.hourlyRateUSD || 35),
    monthlyRateINR: Number(found.monthlyRateINR || 190000),
    relationshipBadge: found.relationshipBadge || (found.status === 'Verified' ? 'Verified Scrizian' : 'Scriza Team Member'),
    location: found.location || 'India',
    timezone: found.timezone || 'IST (UTC+5:30)',
    portfolio: found.portfolio || {
      title: `${found.title} Client Project`,
      isNDA: true,
      description: `Production engineering for client products in ${found.category || 'software'}.`,
      roles: `Lead Specialist · ${Array.isArray(found.skills) ? found.skills.slice(0, 3).join(', ') : 'Tech Stack'}`
    }
  };

  const profileJsonLd = {
    "@context": "https://schema.org/",
    "@type": "ProfilePage",
    "mainEntity": {
      "@type": "Person",
      "name": activeProfile.displayName,
      "identifier": activeProfile.scrizianId,
      "jobTitle": activeProfile.title,
      "knowsAbout": activeProfile.skills,
      "workLocation": activeProfile.location,
      "memberOf": {
        "@type": "Organization",
        "name": "Scriza Private Limited",
        "sameAs": "https://scrizians.com"
      }
    }
  };

  return (
    <>
      <Header onOpenLeadModal={() => setIsLeadModalOpen(true)} />

      {/* Inject Google ProfilePage JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }}
      />

      {/* Dark Navy Hero Section matching reference screenshot media_1790946788744.png */}
      <section className={styles.heroSection}>
        <div className={styles.heroRingWrapper}>
          <div className={styles.heroRing} />
        </div>
        <div className={styles.heroInner}>
          <div className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>Home</Link> /{' '}
            <Link href="/talent" className={styles.breadcrumbLink}>Talent Network</Link> / {activeProfile.scrizianId}
          </div>

          <span className={styles.idEyebrow}>{activeProfile.scrizianId}</span>
          <h1 className={styles.title}>{activeProfile.title}</h1>
          <p className={styles.categorySub}>{activeProfile.category || 'Full Stack Developers'}</p>

          <div className={styles.badgesRow}>
            {activeProfile.relationshipBadge === 'Scriza Team Member' && (
              <span className={styles.badgeScrizaTeam}>Scriza Team Member</span>
            )}
            <span className={styles.badgeVerified}>Verified Scrizian</span>
            <span className={styles.badgeAvailable}>Available for Hire</span>
          </div>
        </div>
      </section>

      {/* Main Two-Column Layout */}
      <div className={styles.mainLayout}>
        {/* Left Main Content Column */}
        <div>
          {/* About Section */}
          <div className={styles.contentCard}>
            <h2 className={styles.cardTitle}>About</h2>
            <p className={styles.aboutText}>{activeProfile.summary}</p>
          </div>

          {/* Verified Skills Section */}
          <div className={styles.contentCard}>
            <h2 className={styles.cardTitle}>Skills</h2>
            <div className={styles.skillsGrid}>
              {activeProfile.skills?.map((skill: string, idx: number) => (
                <span key={idx} className={styles.skillPill}>{skill}</span>
              ))}
            </div>
          </div>

          {/* Portfolio Project Section */}
          {activeProfile.portfolio && (
            <div className={styles.contentCard}>
              <h2 className={styles.cardTitle}>Portfolio</h2>
              <div className={styles.portfolioBox}>
                <div className={styles.portfolioHeader}>
                  <h3 className={styles.portfolioTitle}>{activeProfile.portfolio.title}</h3>
                  {activeProfile.portfolio.isNDA && (
                    <span className={styles.ndaBadge}>🔒 NDA Protected</span>
                  )}
                </div>
                <p className={styles.portfolioDesc}>{activeProfile.portfolio.description}</p>
                <div className={styles.portfolioRoles}>{activeProfile.portfolio.roles}</div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sticky Rate Card matching reference screenshot media_1790946788744.png */}
        <aside className={styles.rateCard}>
          <span className={styles.rateLabel}>INDICATIVE RATE</span>
          <div className={styles.ratePrice}>
            {formatPrice(activeProfile.hourlyRateUSD, activeProfile.monthlyRateINR, 'hr')}
          </div>

          <div className={styles.metaList}>
            <div className={styles.metaItem}>
              <span>⏱️</span> <strong>{activeProfile.experienceYears}+ years experience</strong>
            </div>
            <div className={styles.metaItem}>
              <span>🌐</span> <strong>{activeProfile.timezone || 'IST (UTC+5:30)'}</strong>
            </div>
            <div className={styles.metaItem}>
              <span>📍</span> <strong>{activeProfile.location || 'India'}</strong>
            </div>
          </div>

          <div className={styles.engagementPills}>
            <span className={styles.engagementPill}>Hourly</span>
            <span className={styles.engagementPill}>Monthly</span>
            <span className={styles.engagementPill}>Dedicated</span>
          </div>

          <button 
            className={styles.btnRequestInterview} 
            onClick={() => setIsLeadModalOpen(true)}
          >
            Request interview
          </button>

          <p className={styles.privacyNote}>
            🔒 Personal contact details are protected. Scriza coordinates all interviews.
          </p>
        </aside>
      </div>

      <LeadModal 
        isOpen={isLeadModalOpen} 
        onClose={() => setIsLeadModalOpen(false)}
        prefilledScrizianId={activeProfile.scrizianId}
      />

      <Footer />
    </>
  );
}
