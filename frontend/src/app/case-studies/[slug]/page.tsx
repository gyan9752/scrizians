'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { LeadModal } from '@/components/LeadModal/LeadModal';
import { TalentCard } from '@/components/TalentCard/TalentCard';

const caseStudiesData: Record<string, any> = {
  'uk-health-tech-app-launched-in-14-weeks': {
    title: 'UK Health-Tech App Launched in 14 Weeks',
    tag: 'Healthcare · United Kingdom',
    summary: 'Flutter + Laravel Scrizians delivered a HIPAA-aware patient app from scratch.',
    metrics: [
      { val: '14 wks', label: 'Launch' },
      { val: '4.7', label: 'Store rating' },
      { val: '99.6%', label: 'Crash-free' }
    ],
    challenge: 'A growing London healthcare startup needed a secure, HIPAA/GDPR compliant mobile application to connect NHS patient records with private tele-consultation specialists. In-house recruitment in the UK was quoted at 6+ months.',
    solution: 'Scriza assembled a 4-person dedicated Scrizian pod comprising a Flutter mobile architect (SCR-9012), a Laravel backend lead (SCR-5530), a DevOps engineer (SCR-6102), and a QA automation lead (SCR-5520). The squad integrated OAuth2 NHS login, encrypted WebRTC video calls, and automated deployment pipelines.',
    outcomes: [
      '⚡ Shipped MVP iOS and Android apps to store in 14 business weeks',
      '⭐ Achieved 4.7/5 app store rating across 15,000 active monthly patients',
      '🔒 100% compliance audit pass for NHS Data Security & Protection Toolkit'
    ],
    team: [
      {
        scrizianId: 'SCR-9012',
        displayName: 'Siddharth M.',
        title: 'Senior Mobile Developer (Flutter & iOS)',
        category: 'Mobile Developers',
        summary: '6+ years shipping high-performance Flutter and native iOS applications.',
        experienceYears: 6,
        skills: ['Flutter', 'iOS', 'Android', 'WebRTC'],
        availability: 'Available now',
        hourlyRateUSD: 32,
        monthlyRateINR: 180000,
        relationshipBadge: 'Verified Scrizian',
        avatarText: '12'
      },
      {
        scrizianId: 'SCR-5530',
        displayName: 'Kabir R.',
        title: 'Laravel & PHP Backend Developer',
        category: 'Backend Developers',
        summary: '6+ years engineering enterprise Laravel applications and REST APIs.',
        experienceYears: 6,
        skills: ['Laravel', 'PHP', 'MySQL', 'Redis'],
        availability: 'Available now',
        hourlyRateUSD: 25,
        monthlyRateINR: 140000,
        relationshipBadge: 'Verified Scrizian',
        avatarText: '30'
      }
    ]
  },
  'uae-retailer-cuts-qa-cycle-from-5-days-to-6-hours': {
    title: 'UAE Retailer Cuts QA Cycle from 5 Days to 6 Hours',
    tag: 'Retail & E-commerce · UAE',
    summary: 'QA automation Scrizians built a Playwright regression suite across web and mobile.',
    metrics: [
      { val: '-95%', label: 'Regression time' },
      { val: '82%', label: 'Test coverage' },
      { val: '-70%', label: 'Escaped bugs' }
    ],
    challenge: 'A major omni-channel Dubai retailer faced critical release delays before major shopping festivals due to manual QA bottlenecks across web storefronts and iOS/Android POS systems.',
    solution: 'Scriza deployed QA automation lead SCR-5520 to build a parallelized Playwright and Cypress regression framework integrated directly into GitHub Actions.',
    outcomes: [
      '⚡ Reduced full regression testing time from 5 days down to 6 hours',
      '🛡️ Reached 82% automated test coverage across critical checkout paths',
      '📉 Reduced production-escaped bugs by 70% during peak holiday sales'
    ],
    team: [
      {
        scrizianId: 'SCR-5520',
        displayName: 'Rajesh K.',
        title: 'Lead QA Automation Engineer',
        category: 'QA Engineers',
        summary: '7+ years engineering Playwright and Cypress automation suites for web & mobile apps.',
        experienceYears: 7,
        skills: ['Playwright', 'Cypress', 'Selenium', 'API Testing'],
        availability: 'Available now',
        hourlyRateUSD: 28,
        monthlyRateINR: 150000,
        relationshipBadge: 'Verified Scrizian',
        avatarText: '20'
      }
    ]
  },
  'ai-support-assistant-for-a-european-saas': {
    title: 'AI Support Assistant for a European SaaS',
    tag: 'SaaS · Germany',
    summary: 'Data & AI Scrizians shipped an LLM assistant resolving 40% of tickets automatically.',
    metrics: [
      { val: '40%', label: 'Ticket deflection' },
      { val: '-35%', label: 'First response' },
      { val: '6', label: 'Languages' }
    ],
    challenge: 'A Berlin B2B SaaS platform was overwhelmed with tier-1 customer support tickets in 6 European languages, inflating support operations overhead.',
    solution: 'Scrizian AI Specialist SCR-7719 implemented a Retrieval-Augmented Generation (RAG) agent using LangChain, Python FastAPI, and Pinecone vector search connected to Zendesk.',
    outcomes: [
      '🤖 Automatically resolved 40% of incoming Tier-1 support queries',
      '⏱️ Cut average first response time by 35%',
      '🌍 Multilingual support natively across German, English, French, Spanish, Italian, and Dutch'
    ],
    team: [
      {
        scrizianId: 'SCR-7719',
        displayName: 'Vikram S.',
        title: 'Senior Data & AI Specialist',
        category: 'Data & AI Specialists',
        summary: '6+ years deploying LLM pipelines, RAG systems, PyTorch models and vector databases.',
        experienceYears: 6,
        skills: ['Python', 'PyTorch', 'LangChain', 'FastAPI', 'Vector DB'],
        availability: 'Available now',
        hourlyRateUSD: 45,
        monthlyRateINR: 260000,
        relationshipBadge: 'Verified Scrizian',
        avatarText: '19'
      }
    ]
  },
  'scaling-a-us-fintech-platform-with-a-dedicated-team': {
    title: 'Scaling a US Fintech Platform with a Dedicated Team',
    tag: 'Fintech · United States',
    summary: "A 9-member dedicated Scrizians team rebuilt a lending platform's core in 5 months.",
    metrics: [
      { val: '4x', label: 'Release frequency' },
      { val: '-60%', label: 'Incidents' },
      { val: '9 days', label: 'Time to hire' }
    ],
    challenge: 'A fast-growing US lending platform needed to scale its core engine to support 10x loan origination volume while reducing operational downtime.',
    solution: 'Scriza provided a 9-member dedicated team pod led by Lead Full-Stack Architect SCR-8841 and DevOps Lead SCR-6102 to migrate legacy code to Node.js microservices.',
    outcomes: [
      '🚀 Boosted release deployment frequency from monthly to 4x weekly',
      '📉 Decreased production system incidents by 60%',
      '⏱️ Onboarded complete team within 9 business days'
    ],
    team: [
      {
        scrizianId: 'SCR-8841',
        displayName: 'Aarav M.',
        title: 'Lead Full-Stack Architect',
        category: 'Full Stack Developers',
        summary: '9+ years architecting enterprise Next.js, Node.js and Python microservices on AWS.',
        experienceYears: 9,
        skills: ['Next.js', 'Node.js', 'Python', 'AWS', 'MongoDB'],
        availability: 'Available now',
        hourlyRateUSD: 42,
        monthlyRateINR: 240000,
        relationshipBadge: 'Scriza Team Member',
        avatarText: '41'
      }
    ]
  }
};

import { caseStudyApi } from '@/lib/expressApi';

export default function CaseStudyDetailPage({ params }: { params: { slug: string } }) {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const fallbackCaseStudy = caseStudiesData[params.slug] || caseStudiesData['uk-health-tech-app-launched-in-14-weeks'];
  const [caseStudy, setCaseStudy] = useState<any>(fallbackCaseStudy);

  React.useEffect(() => {
    caseStudyApi.getBySlug(params.slug).then(res => {
      if (res.success && res.data) {
        const c = res.data;
        setCaseStudy({
          title: c.title,
          tag: `${c.category || 'Engineering'} · ${c.region || 'Global'}`,
          summary: c.summary || c.challenge || 'Scrizians delivery case study.',
          metrics: Array.isArray(c.metrics) ? c.metrics : [
            { val: c.deliveryTime || '12 wks', label: 'Launch' },
            { val: '100%', label: 'SLA' }
          ],
          challenge: c.challenge || fallbackCaseStudy.challenge,
          solution: c.solution || fallbackCaseStudy.solution,
          outcomes: Array.isArray(c.outcomes) && c.outcomes.length > 0 ? c.outcomes : (typeof c.results === 'string' ? [c.results] : fallbackCaseStudy.outcomes),
          team: Array.isArray(c.team) && c.team.length > 0 ? c.team.map((m: any) => m.talent || m) : fallbackCaseStudy.team
        });
      }
    });
  }, [params.slug]);

  return (
    <>
      <Header onOpenLeadModal={() => setIsLeadModalOpen(true)} />

      {/* Hero */}
      <section style={{ backgroundColor: '#0A172A', color: '#ffffff', padding: '3.5rem 1.5rem 4.5rem' }}>
        <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
          <div style={{ fontSize: '0.88rem', color: '#94A3B8', marginBottom: '1.5rem' }}>
            <Link href="/" style={{ color: '#94A3B8', textDecoration: 'none' }}>Home</Link> / <Link href="/case-studies" style={{ color: '#94A3B8', textDecoration: 'none' }}>Case Studies</Link> / {caseStudy.title}
          </div>

          <span style={{ color: '#F87171', fontSize: '0.82rem', fontWeight: 800, letterSpacing: '1.4px', textTransform: 'uppercase', display: 'block', marginBottom: '0.8rem' }}>
            {caseStudy.tag}
          </span>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', lineHeight: 1.15 }}>
            {caseStudy.title}
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#94A3B8', maxWidth: '680px', lineHeight: 1.6 }}>
            {caseStudy.summary}
          </p>
        </div>
      </section>

      {/* Metrics Banner */}
      <section style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '2.5rem 1.5rem' }}>
        <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          {caseStudy.metrics.map((m: any, idx: number) => (
            <div key={idx} style={{ background: '#ffffff', border: '1px solid #E2E8F0', padding: '1.5rem', borderRadius: '10px' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#E52B2B', display: 'block' }}>{m.val}</span>
              <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>{m.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Content Details */}
      <main style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '4rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '3.5rem', alignItems: 'start' }}>
          <div>
            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginBottom: '1rem' }}>Business & Technical Challenge</h2>
              <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.7 }}>{caseStudy.challenge}</p>
            </div>

            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginBottom: '1rem' }}>Solution & Delivery Architecture</h2>
              <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.7 }}>{caseStudy.solution}</p>
            </div>

            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginBottom: '1rem' }}>Verified Measurable Outcomes</h2>
              <ul style={{ paddingLeft: '1.2rem', fontSize: '1rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.8rem', lineHeight: 1.6 }}>
                {caseStudy.outcomes.map((outcome: string, idx: number) => (
                  <li key={idx}><strong>{outcome}</strong></li>
                ))}
              </ul>
            </div>
          </div>

          {/* Assigned Scrizians Sidebar */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.8rem', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '1.2rem' }}>Assigned Scrizian Talent</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {caseStudy.team.map((t: any) => (
                <TalentCard key={t.scrizianId} talent={t} onSelectLeadModal={() => setIsLeadModalOpen(true)} />
              ))}
            </div>
          </div>
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
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.4rem' }}>Ready to deliver similar results?</h2>
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

      <LeadModal isOpen={isLeadModalOpen} onClose={() => setIsLeadModalOpen(false)} />
      <Footer />
    </>
  );
}
