'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { LeadModal } from '@/components/LeadModal/LeadModal';
import { portfolioApi } from '@/lib/expressApi';
import styles from '../Portfolio.module.css';

const portfolioDetails: Record<string, any> = {
  'lending-platform-re-architecture': {
    id: 'port-101',
    scrizianId: 'SCR-8841',
    authorRole: 'Lead Full-Stack Architect',
    title: 'Lending Platform Re-architecture',
    industry: 'Fintech / Banking',
    isNdaProtected: true,
    summary: 'Complete microservices migration for a high-volume US lending platform processing $50M+ monthly volume.',
    roleResponsibilities: 'Architected Next.js App Router frontend, Node.js microservices with gRPC communication, Kafka event streaming for real-time credit scoring, and AWS EKS deployment.',
    techStack: ['Next.js', 'Node.js', 'Python', 'Kafka', 'AWS', 'MongoDB'],
    duration: '6 Months',
    outcome: 'Reduced transaction latency by 64%, achieved 99.99% system uptime, and scaled loan approval throughput by 4x.',
    coverImageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=70'
  },
  'd2c-storefront-on-nextjs': {
    id: 'port-102',
    scrizianId: 'SCR-2207',
    authorRole: 'Frontend Engineer',
    title: 'D2C Storefront on Next.js',
    industry: 'E-Commerce / D2C Retail',
    isNdaProtected: false,
    summary: 'Headless commerce storefront built for a fast-growing D2C brand with 98+ Google Lighthouse performance score.',
    roleResponsibilities: 'Developed custom Next.js 14 storefront with Shopify Storefront API integration, optimistic UI cart state, edge caching, and server-side rendering for 50,000+ SKU catalog.',
    techStack: ['Next.js', 'Shopify Storefront API', 'TypeScript', 'TailwindCSS'],
    duration: '3 Months',
    outcome: 'Increased mobile checkout conversion rates by 38% and reduced page load times under 0.8 seconds.',
    coverImageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=70'
  },
  'b2b-analytics-design-system': {
    id: 'port-103',
    scrizianId: 'SCR-3928',
    authorRole: 'Principal Product Designer',
    title: 'B2B Analytics Design System',
    industry: 'SaaS / Enterprise Software',
    isNdaProtected: false,
    summary: 'A 120+ component design system adopted across 4 product teams for enterprise analytics dashboards.',
    roleResponsibilities: 'Created Figma component architecture, dark/light theme tokens, interactive data visualization widgets, accessibility standards (WCAG AAA), and Storybook documentation.',
    techStack: ['Figma', 'Design Systems', 'Storybook', 'User Research'],
    duration: '4 Months',
    outcome: 'Standardized design language across 4 SaaS products and cut frontend UI development time by 45%.',
    coverImageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=70'
  },
  'fitness-tracking-mobile-app': {
    id: 'port-104',
    scrizianId: 'SCR-4416',
    authorRole: 'Senior Mobile Specialist',
    title: 'Fitness Tracking Mobile App',
    industry: 'Health & Fitness Tech',
    isNdaProtected: false,
    summary: 'Cross-platform iOS and Android mobile app with real-time BLE wearable sensor sync and offline workout caching.',
    roleResponsibilities: 'Developed Flutter mobile application, Bluetooth LE integration with Apple Watch and Garmin devices, SQLite local storage sync engine, and Firebase Push notifications.',
    techStack: ['Flutter', 'Firebase', 'BLE Sync', 'SQLite'],
    duration: '5 Months',
    outcome: 'Achieved 4.8-star App Store rating with over 100,000 active monthly subscribers.',
    coverImageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=70'
  },
  'zero-downtime-kubernetes-platform': {
    id: 'port-105',
    scrizianId: 'SCR-6102',
    authorRole: 'Senior DevOps Specialist',
    title: 'Zero-Downtime Kubernetes Platform',
    industry: 'Cloud Infrastructure / DevOps',
    isNdaProtected: false,
    summary: 'Multi-region Google Kubernetes Engine (GKE) production infrastructure with GitOps deployment workflows.',
    roleResponsibilities: 'Designed Terraform IaC modules, ArgoCD GitOps pipelines, Prometheus/Grafana observability stack, and auto-scaling node pools.',
    techStack: ['GKE', 'ArgoCD', 'Terraform', 'Prometheus', 'Docker'],
    duration: '4 Months',
    outcome: 'Maintained 100% zero-downtime during peak Black Friday sales traffic spikes.',
    coverImageUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=70'
  },
  'enterprise-document-qa': {
    id: 'port-106',
    scrizianId: 'SCR-7719',
    authorRole: 'AI & Data Specialist',
    title: 'Enterprise Document Q&A',
    industry: 'Artificial Intelligence / LLM',
    isNdaProtected: true,
    summary: 'Retrieval-Augmented Generation (RAG) assistant querying 2M+ internal enterprise documents with instant citations.',
    roleResponsibilities: 'Implemented Python Fast API backend, Pinecone vector database index, hybrid BM25 + semantic vector search, and OpenAI GPT-4 enterprise pipeline.',
    techStack: ['Python', 'LangChain', 'Pinecone', 'FastAPI', 'OpenAI'],
    duration: '3 Months',
    outcome: 'Reduced employee legal document research time from hours to under 5 seconds with 96% accuracy.',
    coverImageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=70'
  }
};

export default function PortfolioDetailPage({ params }: { params: { slug: string } }) {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  const slug = params.slug.toLowerCase();
  const initialProject = portfolioDetails[slug] || {
    scrizianId: 'SCR-8841',
    authorRole: 'Scrizian Tech Specialist',
    title: slug.replace(/-/g, ' ').toUpperCase(),
    industry: 'Enterprise Technology',
    isNdaProtected: true,
    summary: 'Delivered robust software engineering solution aligned with client security standards and scalable cloud architecture.',
    roleResponsibilities: 'End-to-end full stack execution, API design, security compliance, and CI/CD deployment.',
    techStack: ['Next.js', 'Node.js', 'TypeScript', 'MongoDB'],
    duration: '4 Months',
    outcome: 'Successfully delivered production application on schedule with zero critical vulnerabilities.',
    coverImageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=70'
  };

  const [project, setProject] = useState<any>(initialProject);

  React.useEffect(() => {
    portfolioApi.getBySlug(params.slug).then(res => {
      if (res.success && res.data) {
        const d = res.data;
        setProject({
          id: d.id || d._id,
          scrizianId: d.talent?.scrizianId || 'SCR-8841',
          authorRole: d.role || d.talent?.title || 'Technical Specialist',
          title: d.title,
          industry: d.industry || 'Enterprise Technology',
          isNdaProtected: Boolean(d.ndaProtected),
          summary: d.summary,
          roleResponsibilities: d.role || d.summary,
          techStack: Array.isArray(d.techStack) && d.techStack.length > 0 ? d.techStack : initialProject.techStack,
          duration: d.duration || '4 Months',
          outcome: d.outcome || 'Delivered high impact system architecture.',
          coverImageUrl: (d.media && d.media[0] && d.media[0].url) || initialProject.coverImageUrl
        });
      }
    });
  }, [params.slug]);

  return (
    <>
      <Header onOpenLeadModal={() => setIsLeadModalOpen(true)} />

      {/* Hero Banner */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>Home</Link> / <Link href="/portfolio" className={styles.breadcrumbLink}>Portfolio</Link> / {project.title}
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            <span style={{ background: '#E52B2B', color: '#ffffff', padding: '0.3rem 0.8rem', borderRadius: '4px', fontWeight: 800, fontSize: '0.8rem' }}>
              by {project.scrizianId} · {project.authorRole}
            </span>
            {project.isNdaProtected && (
              <span style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', padding: '0.3rem 0.8rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.8rem' }}>
                🔒 NDA Protected
              </span>
            )}
          </div>

          <h1 className={styles.title} style={{ marginTop: '0.8rem' }}>{project.title}</h1>
          <p className={styles.subtitle}>{project.summary}</p>
        </div>
      </section>

      {/* Main Content */}
      <main style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '3.5rem 1.5rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2.5rem' }}>
        <div>
          <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <img src={project.coverImageUrl} alt={project.title} style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.8rem' }}>Role & Technical Execution</h2>
          <p style={{ fontSize: '1.05rem', color: '#334155', lineHeight: 1.7, marginBottom: '2rem' }}>
            {project.roleResponsibilities}
          </p>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.8rem' }}>Measured Business Impact</h2>
          <div style={{ background: '#F8FAFC', borderLeft: '5px solid #E52B2B', padding: '1.4rem', borderRadius: '8px', fontSize: '1.05rem', fontWeight: 600, color: '#0F172A', lineHeight: 1.6, marginBottom: '2rem' }}>
            🎯 {project.outcome}
          </div>
        </div>

        {/* Sidebar Info */}
        <aside>
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.8rem', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '1.2rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.6rem' }}>Project Metadata</h3>

            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ fontSize: '0.82rem', color: '#64748B', display: 'block' }}>INDUSTRY & TAXONOMY</strong>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>{project.industry}</span>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ fontSize: '0.82rem', color: '#64748B', display: 'block' }}>PROJECT DURATION</strong>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>{project.duration}</span>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <strong style={{ fontSize: '0.82rem', color: '#64748B', display: 'block', marginBottom: '0.4rem' }}>TECH STACK USED</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {project.techStack.map((tech: string, i: number) => (
                  <span key={i} style={{ background: '#0F172A', color: '#ffffff', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 700 }}>
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsLeadModalOpen(true)}
              style={{ width: '100%', background: '#E52B2B', color: '#ffffff', padding: '0.85rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.95rem', border: 'none', cursor: 'pointer' }}
            >
              Hire Developer Like {project.scrizianId} →
            </button>
          </div>
        </aside>
      </main>

      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        prefilledScrizianId={project.scrizianId}
      />

      <Footer />
    </>
  );
}
