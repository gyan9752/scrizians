'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { LeadModal } from '@/components/LeadModal/LeadModal';
import styles from '../hire-talent/HireTalent.module.css';

export default function HireDevelopersFromIndiaPage() {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  return (
    <>
      <Header onOpenLeadModal={() => setIsLeadModalOpen(true)} />

      <section style={{ backgroundColor: '#0B172A', color: '#ffffff', padding: '4.5rem 1.5rem 4rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#E52B2B', textTransform: 'uppercase', letterSpacing: '1px' }}>
            GLOBAL OFFSHORE ENGINEERING
          </span>
          <h1 style={{ fontSize: '2.6rem', fontWeight: 800, margin: '0.8rem 0 1rem', letterSpacing: '-0.5px' }}>
            Hire Developers from India
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#94A3B8', maxWidth: '700px', margin: '0 auto 2rem', lineHeight: '1.6' }}>
            Access top 1% Indian software engineers, full-stack architects, DevOps specialists, and UI/UX designers with 100% fluent English & timezone alignment.
          </p>

          <button 
            style={{ backgroundColor: '#E52B2B', color: '#ffffff', padding: '0.9rem 2.2rem', borderRadius: '8px', fontSize: '1rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}
            onClick={() => setIsLeadModalOpen(true)}
          >
            Request Indian Talent Profiles →
          </button>
        </div>
      </section>

      {/* Value Pillars */}
      <section style={{ padding: '4.5rem 1.5rem', backgroundColor: '#F8FAFC' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '2rem' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.8rem' }}>🇮🇳</span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>Top 1% Vetted Talent</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: '1.6' }}>Rigorous coding benchmarks, architecture audits, and background checks by Scriza engineering leads.</p>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '2rem' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.8rem' }}>🌐</span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>Timezone Alignment</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: '1.6' }}>Engineers available in EST, PST, GMT, and CET overlaps for daily standups and sprint planning.</p>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '2rem' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.8rem' }}>🔒</span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>Enterprise Security</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: '1.6' }}>Comprehensive NDA protection, IP transfer, and compliance backed by Scriza Private Limited.</p>
          </div>
        </div>
      </section>

      <LeadModal isOpen={isLeadModalOpen} onClose={() => setIsLeadModalOpen(false)} />
      <Footer />
    </>
  );
}
