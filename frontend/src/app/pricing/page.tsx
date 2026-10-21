'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { LeadModal } from '@/components/LeadModal/LeadModal';
import { useCurrency } from '@/context/CurrencyContext';
import { pricingApi } from '@/lib/expressApi';
import styles from './Pricing.module.css';

const defaultPricingModels = [
  {
    title: 'Hourly Talent',
    subtitle: 'Flexible hourly hiring for short-term tasks & specialist support.',
    priceINR: '₹1,200',
    unitINR: '/ hour',
    priceUSD: '$18',
    unitUSD: '/ hour',
    badge: 'Flexible On-Demand',
    features: [
      'Pay only for logged hours',
      'Direct slack & async communication',
      'Weekly time tracking reports',
      'Replace or pause anytime',
      'Zero setup or lock-in fee'
    ],
    popular: false,
    ctaText: 'Hire Hourly Talent'
  },
    {
      title: 'Part-Time Developer',
      subtitle: '20 hours/week dedicated focus for steady product progress.',
      priceINR: '₹60,000',
      unitINR: '/ month',
      priceUSD: '$750',
      unitUSD: '/ month',
      badge: '20 Hrs / Week',
      features: [
        'Dedicated part-time specialist',
        'Overlap with your timezone',
        'Daily standups & progress reports',
        'IP & code ownership 100%',
        'Dedicated Scriza manager'
      ],
      popular: false,
      ctaText: 'Start Part-Time'
    },
    {
      title: 'Dedicated Developer',
      subtitle: '40 hours/week full-time developer integrated into your team.',
      priceINR: '₹1,20,000',
      unitINR: '/ month',
      priceUSD: '$1,500',
      unitUSD: '/ month',
      badge: 'Most Popular',
      features: [
        '100% full-time allocation (160h/mo)',
        'Full alignment with your work culture',
        'Direct access to code & repositories',
        'Free 1-week risk-free trial',
        'NDA & strict IP protection'
      ],
      popular: true,
      ctaText: 'Hire Dedicated Developer'
    },
    {
      title: 'Senior / Specialist',
      subtitle: 'Principal architects, DevOps leads, and AI/ML engineers.',
      priceINR: '₹2,00,000',
      unitINR: '/ month',
      priceUSD: '$2,500',
      unitUSD: '/ month',
      badge: 'High Impact',
      features: [
        'Lead architect / Principal level',
        'Complex system design & cloud IaC',
        'Codebase audits & mentoring',
        '99.9% SLA & delivery governance',
        'Scriza executive support'
      ],
      popular: false,
      ctaText: 'Hire Senior Specialist'
    },
    {
      title: 'Offshore ODC Team',
      subtitle: 'Complete managed engineering pod with leads, QA & PM.',
      priceINR: 'Custom Quote',
      unitINR: '',
      priceUSD: 'Custom Quote',
      unitUSD: '',
      badge: 'Managed Pod',
      features: [
        '3 to 20+ cross-functional team',
        'Dedicated Project Manager & QA',
        'Sprint planning & Jira velocity',
        'Scale up or down in 14 days',
        'Enterprise SLA & security'
      ],
      popular: false,
      ctaText: 'Build Dedicated Team'
    },
    {
      title: 'Project-Based Delivery',
      subtitle: 'Fixed scope, milestone-based turnkey software development.',
      priceINR: 'Fixed Price',
      unitINR: '',
      priceUSD: 'Fixed Price',
      unitUSD: '',
      badge: 'Milestone Delivery',
      features: [
        'Guaranteed scope & delivery timeline',
        'Milestone-based release payments',
        'Comprehensive UX/UI + Architecture',
        '30 days post-launch warranty',
        'End-to-end Scriza governance'
      ],
      popular: false,
      ctaText: 'Request Fixed Quote'
    }
  ];

export default function PricingPage() {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const { currency } = useCurrency();
  const [pricingModels, setPricingModels] = useState<any[]>(defaultPricingModels);

  useEffect(() => {
    pricingApi.getPublic().then(res => {
      if (res.success && res.data?.pricing && Array.isArray(res.data.pricing) && res.data.pricing.length > 0) {
        const livePricingMap: Record<string, any> = {};
        res.data.pricing.forEach((p: any) => {
          livePricingMap[p.engagementType] = p;
        });

        const merged = defaultPricingModels.map(model => {
          const live = livePricingMap[model.title] || 
            (model.title === 'Part-Time Developer' ? livePricingMap['Part-Time Resource'] : null) ||
            (model.title === 'Offshore ODC Team' ? livePricingMap['Dedicated Team'] : null);

          if (live) {
            return {
              ...model,
              priceINR: live.inr?.from ? `₹${live.inr.from.toLocaleString()}` : model.priceINR,
              priceUSD: live.usd?.from ? `$${live.usd.from.toLocaleString()}` : model.priceUSD,
              badge: live.displayLabel || model.badge
            };
          }
          return model;
        });
        setPricingModels(merged);
      }
    });
  }, []);

  const faqs = [
    {
      q: 'Are the prices fixed or indicative?',
      a: 'The listed prices are indicative starting rates. The exact monthly or hourly rate depends on the talent’s seniority, tech stack complexity, and duration.'
    },
    {
      q: 'Is there a free trial period?',
      a: 'Yes, for dedicated full-time hires, we provide a 1-week risk-free trial. If you are not completely satisfied, you pay nothing.'
    },
    {
      q: 'How does currency switching work?',
      a: 'You can toggle between USD ($) for global clients and INR (₹) for Indian enterprises directly in the top header bar.'
    },
    {
      q: 'Who manages the IP and code security?',
      a: 'All intellectual property, source code, and assets belong 100% to your company under legally binding NDA agreements backed by Scriza Private Limited.'
    }
  ];

  return (
    <>
      <Header onOpenLeadModal={() => setIsLeadModalOpen(true)} />

      {/* Hero Section matching standard site subpages design */}
      <section className={styles.heroSection}>
        <div className={styles.heroRingWrapper}>
          <div className={styles.heroRing} />
        </div>

        <div className={styles.heroInner}>
          <div className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>Home</Link> / Pricing & Engagement Models
          </div>

          <span className={styles.eyebrow}>TRANSPARENT ENGAGEMENT MODELS</span>
          <h1 className={styles.heroTitle}>Flexible Engagement Models</h1>
          <p className={styles.heroSub}>
            Simple, transparent pricing tailored for startups, scaling SaaS, and enterprise engineering teams.
          </p>
        </div>
      </section>

      {/* Pricing Grid */}
      <section className={styles.gridSection}>
        <div className={styles.gridInner}>
          <div className={styles.cardsGrid}>
            {pricingModels.map((item, idx) => (
              <div key={idx} className={`${styles.priceCard} ${item.popular ? styles.popularCard : ''}`}>
                {item.popular && <div className={styles.popularBadge}>Most Popular</div>}
                
                <span className={styles.badgeTag}>{item.badge}</span>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardSubtitle}>{item.subtitle}</p>

                <div className={styles.priceRow}>
                  <span className={styles.priceAmount}>
                    {currency === 'USD' ? item.priceUSD : item.priceINR}
                  </span>
                  <span className={styles.priceUnit}>
                    {currency === 'USD' ? item.unitUSD : item.unitINR}
                  </span>
                </div>

                <ul className={styles.featureList}>
                  {item.features.map((feat, fIdx) => (
                    <li key={fIdx}>
                      <span className={styles.checkIcon}>✓</span> {feat}
                    </li>
                  ))}
                </ul>

                <button 
                  className={`${styles.ctaBtn} ${item.popular ? styles.ctaBtnPrimary : styles.ctaBtnSecondary}`}
                  onClick={() => setIsLeadModalOpen(true)}
                >
                  {item.ctaText} →
                </button>
              </div>
            ))}
          </div>

          <div className={styles.disclaimerBox}>
            <p>
              💡 <strong>Indicative Rate Note:</strong> Rates are starting estimates based on standard Indian engineering tiers. Custom quotes are provided within 24 hours based on your exact technology stack, timezone requirements, and team size.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <div className={styles.faqInner}>
          <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
          <div className={styles.faqGrid}>
            {faqs.map((faq, idx) => (
              <div key={idx} className={styles.faqCard}>
                <h4 className={styles.faqQ}>Q. {faq.q}</h4>
                <p className={styles.faqA}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className={styles.bottomCtaSection}>
        <div className={styles.bottomCtaInner}>
          <h2>Ready to Build Your Engineering Team?</h2>
          <p>Talk to our technical talent advisors to get a custom proposal within 24 hours.</p>
          <button className={styles.btnPrimaryCta} onClick={() => setIsLeadModalOpen(true)}>
            Discuss Your Requirement →
          </button>
        </div>
      </section>

      <LeadModal isOpen={isLeadModalOpen} onClose={() => setIsLeadModalOpen(false)} />
      <Footer />
    </>
  );
}
