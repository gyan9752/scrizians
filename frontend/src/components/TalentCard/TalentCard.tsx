'use client';

import React from 'react';
import Link from 'next/link';
import { useCurrency } from '@/context/CurrencyContext';
import styles from './TalentCard.module.css';

export interface Talent {
  scrizianId: string;
  displayName: string;
  title: string;
  category?: string;
  summary: string;
  experienceYears: number;
  skills: string[];
  availability: string;
  hourlyRateUSD: number;
  monthlyRateINR?: number;
  relationshipBadge: 'Scriza Team Member' | 'Verified Scrizian' | 'Community Member' | 'Available for Hire';
  avatarText?: string;
}

interface TalentCardProps {
  talent: Talent;
  onSelectLeadModal?: (scrizianId: string) => void;
}

export const TalentCard: React.FC<TalentCardProps> = ({ talent }) => {
  const { formatPrice } = useCurrency();

  // Extract avatar number from Scrizian ID (e.g. SCR-8841 -> 41)
  const avatarNumber = talent.avatarText || talent.scrizianId.slice(-2);

  return (
    <div className={styles.card}>
      <div>
        <div className={styles.headRow}>
          <div className={styles.avatarBox}>{avatarNumber}</div>
          <div>
            <span className={styles.scrizianIdRed}>{talent.scrizianId}</span>
            <h3 className={styles.title}>{talent.title}</h3>
            <span className={styles.categorySub}>{talent.category || 'Full Stack Developers'}</span>
          </div>
        </div>

        <div className={styles.badgesRow}>
          {talent.relationshipBadge === 'Scriza Team Member' && (
            <span className={styles.badgeScrizaTeam}>Scriza Team Member</span>
          )}
          {talent.relationshipBadge === 'Verified Scrizian' && (
            <span className={styles.badgeVerified}>✓ Verified Scrizian</span>
          )}
          {talent.relationshipBadge === 'Community Member' && (
            <span className={styles.badgeCommunity} style={{ background: '#F1F5F9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>Community Member</span>
          )}
          {talent.relationshipBadge === 'Available for Hire' && (
            <span className={styles.badgeAvailable}>Available for Hire</span>
          )}
        </div>

        <div className={styles.skillsRow}>
          {talent.skills.map((skill, idx) => (
            <span key={idx} className={styles.skillChip}>{skill}</span>
          ))}
        </div>

        <div className={styles.metaRow}>
          <span>⏱️ {talent.experienceYears}+ yrs</span>
          <span>🌐 IST (UTC+5:30)</span>
        </div>

        <span className={styles.availGreen}>Available now</span>
      </div>

      <div className={styles.footerRow}>
        <div>
          <span className={styles.startingLabel}>STARTING FROM</span>
          <div className={styles.priceText}>
            {formatPrice(talent.hourlyRateUSD, talent.monthlyRateINR, 'hr')}
          </div>
        </div>

        <Link href={`/talent/${talent.scrizianId}`} className={styles.viewProfileLink}>
          View profile →
        </Link>
      </div>
    </div>
  );
};
