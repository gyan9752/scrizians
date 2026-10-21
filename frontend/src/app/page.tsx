'use client';

import { talentApi, articleApi } from '@/lib/expressApi';
import { adaptTalent, adaptArticle } from '@/lib/adapters';
import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { TalentCard, Talent } from '@/components/TalentCard/TalentCard';
import { LeadModal } from '@/components/LeadModal/LeadModal';
import { useCurrency } from '@/context/CurrencyContext';
import { getStoredData, initialTalentList, initialArticlesList } from '@/utils/dataSync';
import styles from './Home.module.css';

export default function HomePage() {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedScrizianId, setSelectedScrizianId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const { formatPrice } = useCurrency();

  const [dynamicTalent, setDynamicTalent] = useState<any[]>([]);
  const [dynamicInsights, setDynamicInsights] = useState<any[]>([]);

  React.useEffect(() => {
    talentApi.getAll('limit=12').then(res => {
      if (res.success && Array.isArray(res.data)) {
        const list = res.data.map(adaptTalent);
        setDynamicTalent(list);
        localStorage.setItem('scrizians_talent_list', JSON.stringify(list));
      }
    });

    articleApi.getAll().then(res => {
      if (res.success && Array.isArray(res.data)) {
        const list = res.data.map(adaptArticle);
        setDynamicInsights(list);
        localStorage.setItem('scrizians_insights_list', JSON.stringify(list));
      }
    });
  }, []);

  const handleOpenModal = (scrizianId?: string) => {
    setSelectedScrizianId(scrizianId);
    setIsLeadModalOpen(true);
  };

  return (
    <>
      <Header onOpenLeadModal={() => handleOpenModal()} />

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroGlowOne}></div>
        <div className={styles.heroGlowTwo}></div>
        <div className={styles.heroGrid}>
          <div>
            <span className={styles.slogan}><span className={styles.sloganSpan}></span> TALENT. TECHNOLOGY. TOGETHER.</span>
            <h1 className={styles.heroTitle}>
              Build Your Team with <em>Curated Tech Talent</em> from India.
            </h1>
            <p className={styles.heroSubtitle}>
              Discover developers, designers, QA engineers, DevOps professionals and digital specialists through the Scrizians Talent Network.
            </p>

            <form 
              className={styles.searchForm} 
              onSubmit={(e) => { e.preventDefault(); window.location.href = `/talent?q=${encodeURIComponent(searchQuery)}`; }}
            >
              <span className={styles.searchIcon} aria-hidden="true">🔍</span>
              <input 
                type="text"
                id="search-skills-hero"
                name="q"
                aria-label="Search skills e.g. React, DevOps, Flutter"
                className={styles.searchInput}
                placeholder="Search skills e.g. React, DevOps, Flutter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" aria-label="Submit search for talent" className={styles.searchSubmit}>Find talent</button>
            </form>

            <div className={styles.heroCtas}>
              <button type="button" aria-label="Hire Scrizians Talent" className={styles.btnPrimary} onClick={() => handleOpenModal()}>
                Hire Talent
              </button>
              <Link href="/become-a-scrizian" aria-label="Join Scrizians Talent Network" className={styles.btnWhite}>
                Join as a Scrizian
              </Link>
            </div>
          </div>

          {/* Side Live Network Preview Card */}
          <div className={styles.previewWidget}>
            <div className={styles.previewHead}>
              <span><span className={styles.liveDot}></span> Live Talent Network</span>
              <strong style={{ color: '#ffffff' }}>{dynamicTalent.length} verified</strong>
            </div>

            {dynamicTalent.slice(0, 4).map(t => {
              const scrizianId = t.id || t.scrizianId || 'SCR-1001';
              const avatarText = scrizianId.replace(/[^0-9]/g, '').slice(-2) || '00';
              const skillsList = Array.isArray(t.skills) ? t.skills.slice(0, 2).join(', ') : String(t.skills || '').split(',').slice(0, 2).join(', ');
              const hrUSD = Number(t.hourlyRateUSD || 35);
              const moINR = Number(t.monthlyRateINR || 190000);
              return (
                <Link key={scrizianId} href={`/talent/${scrizianId}`} className={styles.previewRow}>
                  <div className={styles.avatarRed}>{avatarText}</div>
                  <div className={styles.previewInfo}>
                    <span className={styles.previewTitle}>{t.title}</span>
                    <span className={styles.previewSub}>{scrizianId} · {t.experienceYears || 7}+ yrs · {skillsList}</span>
                  </div>
                  <span className={styles.previewRate}>{formatPrice(hrUSD, moINR, 'hr')}</span>
                </Link>
              );
            })}

            <Link href="/talent" className={styles.btnBrowseAll}>
              Browse full network →
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Bar BELOW HERO: WHITE BACKGROUND (#FFFFFF) */}
      <section className={styles.trustBar}>
        <div className={styles.trustGrid}>
          <div className={styles.trustItem}>
            <span className={styles.trustIcon}>🛡️</span>
            <div>
              <strong>Privacy-first</strong>
              <p>Talent identity via Scrizian ID; all contact routed through Scriza.</p>
            </div>
          </div>
          <div className={styles.trustItem}>
            <span className={styles.trustIcon}>✅</span>
            <div>
              <strong>Curated & verified</strong>
              <p>Every profile reviewed and approved before going live.</p>
            </div>
          </div>
          <div className={styles.trustItem}>
            <span className={styles.trustIcon}>⏱️</span>
            <div>
              <strong>48-hour shortlists</strong>
              <p>Receive matched profiles in two business days.</p>
            </div>
          </div>
          <div className={styles.trustItem}>
            <span className={styles.trustIcon}>🌐</span>
            <div>
              <strong>International-first</strong>
              <p>USD & INR pricing, timezone-aligned availability.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HIRE BY ROLE SECTION */}
      <section className={styles.section}>
        <div className={styles.sectionHeaderRow}>
          <div>
            <span className={styles.eyebrow}>HIRE BY ROLE</span>
            <h2 className={styles.sectionTitle}>Talent for every layer of your<br/>product</h2>
            <p className={styles.sectionSubtitle}>
              From pixel-perfect frontends to resilient cloud infrastructure — curated Scrizians across 9 disciplines.
            </p>
          </div>
          <Link href="/hire-talent" className={styles.btnAllRoles}>
            All roles
          </Link>
        </div>

        <div className={styles.rolesGridContainer}>
          <Link href="/hire-talent?role=frontend" className={styles.roleCell}>
            <div>
              <span className={styles.roleCellNum}>01</span>
              <h3 className={styles.roleCellTitle}>Hire Frontend Developers</h3>
              <p className={styles.roleCellDesc}>React, Next.js, Angular and Vue engineers who ship fast, accessible interfaces.</p>
            </div>
            <span className={styles.roleCellSkills}>React · Next.js · Angular · TypeScript</span>
          </Link>

          <Link href="/hire-talent?role=backend" className={styles.roleCell}>
            <div>
              <span className={styles.roleCellNum}>02</span>
              <h3 className={styles.roleCellTitle}>Hire Backend Developers</h3>
              <p className={styles.roleCellDesc}>Node.js, Laravel, Java and .NET engineers for secure, scalable APIs.</p>
            </div>
            <span className={styles.roleCellSkills}>Node.js · Laravel · Java · .NET</span>
          </Link>

          <Link href="/hire-talent?role=fullstack" className={styles.roleCell}>
            <div>
              <span className={styles.roleCellNum}>03</span>
              <h3 className={styles.roleCellTitle}>Hire Full Stack Developers</h3>
              <p className={styles.roleCellDesc}>End-to-end product engineers comfortable from database to UI.</p>
            </div>
            <span className={styles.roleCellSkills}>MERN · Next.js · Python · AWS</span>
          </Link>

          <Link href="/hire-talent?role=qa" className={styles.roleCell}>
            <div>
              <span className={styles.roleCellNum}>04</span>
              <h3 className={styles.roleCellTitle}>Hire QA Engineers</h3>
              <p className={styles.roleCellDesc}>Manual and automation testers who protect every release.</p>
            </div>
            <span className={styles.roleCellSkills}>Playwright · Selenium · Cypress · API Testing</span>
          </Link>

          <Link href="/hire-talent?role=devops" className={styles.roleCell}>
            <div>
              <span className={styles.roleCellNum}>05</span>
              <h3 className={styles.roleCellTitle}>Hire DevOps Engineers</h3>
              <p className={styles.roleCellDesc}>Cloud, CI/CD and Kubernetes specialists for reliable delivery.</p>
            </div>
            <span className={styles.roleCellSkills}>Kubernetes · Terraform · AWS · GCP</span>
          </Link>

          <Link href="/hire-talent?role=uiux" className={styles.roleCell}>
            <div>
              <span className={styles.roleCellNum}>06</span>
              <h3 className={styles.roleCellTitle}>Hire UI/UX Designers</h3>
              <p className={styles.roleCellDesc}>Product designers who turn research into conversion-focused experiences.</p>
            </div>
            <span className={styles.roleCellSkills}>Figma · Design Systems · Prototyping</span>
          </Link>

          <Link href="/hire-talent?role=mobile" className={styles.roleCell}>
            <div>
              <span className={styles.roleCellNum}>07</span>
              <h3 className={styles.roleCellTitle}>Hire Mobile Developers</h3>
              <p className={styles.roleCellDesc}>Flutter, Android and iOS developers for store-ready apps.</p>
            </div>
            <span className={styles.roleCellSkills}>Flutter · Android · iOS · React Native</span>
          </Link>

          <Link href="/hire-talent?role=data-ai" className={styles.roleCell}>
            <div>
              <span className={styles.roleCellNum}>08</span>
              <h3 className={styles.roleCellTitle}>Hire Data & AI Specialists</h3>
              <p className={styles.roleCellDesc}>ML, LLM and data engineers delivering production AI features.</p>
            </div>
            <span className={styles.roleCellSkills}>Python · PyTorch · LangChain</span>
          </Link>

          <Link href="/hire-talent?role=seo-digital" className={styles.roleCell}>
            <div>
              <span className={styles.roleCellNum}>09</span>
              <h3 className={styles.roleCellTitle}>Hire SEO & Digital Talent</h3>
              <p className={styles.roleCellDesc}>Technical SEO and growth specialists for organic pipeline.</p>
            </div>
            <span className={styles.roleCellSkills}>Technical SEO · GA4 · Content</span>
          </Link>
        </div>
      </section>

      {/* FEATURED SCRIZIANS SECTION */}
      <section className={styles.section} style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
        <div className={styles.sectionHeaderRow}>
          <div>
            <span className={styles.eyebrow}>FEATURED SCRIZIANS</span>
            <h2 className={styles.sectionTitle}>Verified professionals, ready to interview</h2>
            <p className={styles.sectionSubtitle}>
              Profiles show Scrizian ID, skills and indicative rates — never personal contact details.
            </p>
          </div>
          <Link href="/talent" className={styles.btnDarkNavy}>
            Explore Talent Network
          </Link>
        </div>

        <div className={styles.featuredCardsGrid}>
          {dynamicTalent.slice(0, 4).map(t => {
            const talentObj: Talent = {
              scrizianId: t.id || t.scrizianId,
              displayName: t.displayName || t.name,
              title: t.title,
              category: t.category || 'Full Stack Developers',
              summary: t.summary || `${t.experienceYears || 7}+ years experience in ${t.skills || 'software development'}.`,
              experienceYears: t.experienceYears || 7,
              skills: Array.isArray(t.skills) ? t.skills : String(t.skills || '').split(',').map(s => s.trim()),
              availability: t.availability || 'Available now',
              hourlyRateUSD: Number(t.hourlyRateUSD || 35),
              monthlyRateINR: Number(t.monthlyRateINR || 190000),
              relationshipBadge: t.relationshipBadge || 'Verified Scrizian',
              avatarText: (t.id || t.scrizianId || '00').replace(/[^0-9]/g, '').slice(-2) || '00'
            };
            return (
              <TalentCard 
                key={talentObj.scrizianId} 
                talent={talentObj} 
                onSelectLeadModal={(id) => handleOpenModal(id)}
              />
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className={styles.howItWorksSection}>
        <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
          <span className={styles.eyebrow} style={{ color: '#F87171' }}>HOW IT WORKS</span>
          <h2 style={{ fontSize: '2.3rem', fontWeight: 800, color: '#ffffff' }}>From requirement to onboarded in days</h2>
        </div>

        <div className={styles.stepsGrid}>
          <div className={styles.stepCol}>
            <span className={styles.stepNumRed}>01</span>
            <h3 className={styles.stepTitle}>Share your requirement</h3>
            <p className={styles.stepText}>Tell us the role, skills, timezone and engagement model you need.</p>
          </div>

          <div className={styles.stepCol}>
            <span className={styles.stepNumRed}>02</span>
            <h3 className={styles.stepTitle}>Get a curated shortlist</h3>
            <p className={styles.stepText}>Receive verified Scrizian profiles within 48 hours — no endless CV piles.</p>
          </div>

          <div className={styles.stepCol}>
            <span className={styles.stepNumRed}>03</span>
            <h3 className={styles.stepTitle}>Interview & select</h3>
            <p className={styles.stepText}>Request interviews through Scrizians and evaluate real skills.</p>
          </div>

          <div className={styles.stepCol}>
            <span className={styles.stepNumRed}>04</span>
            <h3 className={styles.stepTitle}>Onboard & scale</h3>
            <p className={styles.stepText}>Start in days with Scriza handling contracts, compliance and continuity.</p>
          </div>
        </div>
      </section>

      {/* ENGAGEMENT MODELS SECTION */}
      <section className={styles.section}>
        <div className={styles.sectionHeaderRow}>
          <div>
            <span className={styles.eyebrow}>ENGAGEMENT MODELS</span>
            <h2 className={styles.sectionTitle}>Flexible ways to work with Scrizians</h2>
            <p className={styles.sectionSubtitle}>
              Indicative starting prices — final quotes depend on skills, seniority and duration.
            </p>
          </div>
        </div>

        <div className={styles.modelsGrid5}>
          <Link href="/solutions#staff-augmentation" className={styles.modelCard}>
            <div>
              <h3 className={styles.modelTitle}>Staff Augmentation</h3>
              <p className={styles.modelDesc}>Add vetted Scrizians to your existing team on a monthly basis.</p>
            </div>
            <div className={styles.modelPriceBox}>
              <span className={styles.startingLabel}>STARTING FROM</span>
              <div className={styles.priceVal}>{formatPrice(2400, 190000, 'mo')}</div>
            </div>
          </Link>

          <Link href="/solutions#dedicated-developers" className={styles.modelCard}>
            <div>
              <h3 className={styles.modelTitle}>Dedicated Developers</h3>
              <p className={styles.modelDesc}>Full-time developers working exclusively on your product.</p>
            </div>
            <div className={styles.modelPriceBox}>
              <span className={styles.startingLabel}>STARTING FROM</span>
              <div className={styles.priceVal}>{formatPrice(2800, 220000, 'mo')}</div>
            </div>
          </Link>

          <Link href="/solutions#dedicated-team" className={styles.modelCard}>
            <div>
              <h3 className={styles.modelTitle}>Dedicated Team</h3>
              <p className={styles.modelDesc}>A cross-functional pod with PM, developers and QA.</p>
            </div>
            <div className={styles.modelPriceBox}>
              <span className={styles.startingLabel}>STARTING FROM</span>
              <div className={styles.priceVal}>{formatPrice(9500, 750000, 'mo')}</div>
            </div>
          </Link>

          <Link href="/solutions#offshore-team" className={styles.modelCard}>
            <div>
              <h3 className={styles.modelTitle}>Offshore Team</h3>
              <p className={styles.modelDesc}>Managed offshore delivery center operated by Scriza.</p>
            </div>
            <div className={styles.modelPriceBox}>
              <span className={styles.startingLabel}>STARTING FROM</span>
              <div className={styles.priceVal}>{formatPrice(15000, 1200000, 'mo')}</div>
            </div>
          </Link>

          <Link href="/solutions#remote-team" className={styles.modelCard}>
            <div>
              <h3 className={styles.modelTitle}>Remote Team</h3>
              <p className={styles.modelDesc}>Timezone-aligned remote professionals on hourly or monthly plans.</p>
            </div>
            <div className={styles.modelPriceBox}>
              <span className={styles.startingLabel}>STARTING FROM</span>
              <div className={styles.priceVal}>{formatPrice(20, 1500, 'hr')}</div>
            </div>
          </Link>
        </div>
      </section>

      {/* PROOF / CASE STUDIES SECTION */}
      <section className={styles.section} style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
        <div className={styles.sectionHeaderRow}>
          <div>
            <span className={styles.eyebrow}>PROOF</span>
            <h2 className={styles.sectionTitle}>Outcomes delivered for global clients</h2>
          </div>
          <Link href="/case-studies" className={styles.btnAllRoles}>
            All case studies
          </Link>
        </div>

        <div className={styles.caseGrid2}>
          <Link href="/case-studies/uk-health-tech-app-launched-in-14-weeks" className={styles.caseCard} aria-label="Case Study: UK Health-Tech App Launched in 14 Weeks">
            <div>
              <div className={styles.caseMedia} style={{ backgroundImage: `url('https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=600&q=75&fm=webp')` }}>
                <span className={styles.caseTagOverlay}>Healthcare · United Kingdom</span>
              </div>
              <div className={styles.caseBody}>
                <h3 className={styles.caseTitle}>UK Health-Tech App Launched in 14 Weeks</h3>
                <p className={styles.caseDesc}>Flutter + Laravel Scrizians delivered a HIPAA-aware patient app from scratch.</p>
              </div>
            </div>

            <div className={styles.caseBody} style={{ paddingTop: 0 }}>
              <div className={styles.metricsRow}>
                <div>
                  <span className={styles.metricNumRed}>14 wks</span>
                  <span className={styles.metricLabel}>Launch</span>
                </div>
                <div>
                  <span className={styles.metricNumRed}>4.7</span>
                  <span className={styles.metricLabel}>Store rating</span>
                </div>
                <div>
                  <span className={styles.metricNumRed}>99.6%</span>
                  <span className={styles.metricLabel}>Crash-free</span>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/case-studies/uae-retailer-cuts-qa-cycle-from-5-days-to-6-hours" className={styles.caseCard} aria-label="Case Study: UAE Retailer Cuts QA Cycle from 5 Days to 6 Hours">
            <div>
              <div className={styles.caseMedia} style={{ backgroundImage: `url('https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=600&q=75&fm=webp')` }}>
                <span className={styles.caseTagOverlay}>Retail & E-commerce · UAE</span>
              </div>
              <div className={styles.caseBody}>
                <h3 className={styles.caseTitle}>UAE Retailer Cuts QA Cycle from 5 Days to 6 Hours</h3>
                <p className={styles.caseDesc}>QA automation Scrizians built a Playwright regression suite across web and mobile.</p>
              </div>
            </div>

            <div className={styles.caseBody} style={{ paddingTop: 0 }}>
              <div className={styles.metricsRow}>
                <div>
                  <span className={styles.metricNumRed}>-95%</span>
                  <span className={styles.metricLabel}>Regression time</span>
                </div>
                <div>
                  <span className={styles.metricNumRed}>82%</span>
                  <span className={styles.metricLabel}>Test coverage</span>
                </div>
                <div>
                  <span className={styles.metricNumRed}>-70%</span>
                  <span className={styles.metricLabel}>Escaped bugs</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* INSIGHTS SECTION */}
      <section className={styles.section}>
        <div className={styles.sectionHeaderRow}>
          <div>
            <span className={styles.eyebrow}>INSIGHTS</span>
            <h2 className={styles.sectionTitle}>Hiring guides & engineering knowledge</h2>
          </div>
          <Link href="/insights" className={styles.btnAllRoles}>
            Read insights
          </Link>
        </div>

        <div className={styles.insightsGrid3}>
          {dynamicInsights.slice(0, 3).map(art => (
            <Link key={art.id} href={`/insights/${art.slug || art.id}`} className={styles.articleCard} aria-label={`Read insight: ${art.title}`}>
              <div className={styles.articleMedia} style={{ backgroundImage: `url('${art.coverImageUrl || art.image || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=75&fm=webp'}')` }} />
              <div className={styles.articleBody}>
                <span className={styles.articleCatRed}>{String(art.category || art.cat || 'HIRING GUIDES').toUpperCase()}</span>
                <h3 className={styles.articleTitle}>{art.title}</h3>
                <p className={styles.articleExcerpt}>{art.excerpt || `Deep dive guide on ${art.title}.`}</p>
                <div className={styles.articleMeta}>{art.author || 'Scrizians Editorial'} · {art.publishedDate || '02 Oct 2026'} · {art.readTime || '5 min read'}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className={styles.section} style={{ borderTop: '1px solid #E2E8F0' }}>
        <div className={styles.faqGrid2}>
          <div>
            <span className={styles.eyebrow}>FAQ</span>
            <h2 className={styles.sectionTitle}>Questions clients ask us</h2>
            <p className={styles.sectionSubtitle}>Still curious? Call us at +91 91191 12999.</p>
          </div>

          <div>
            {[
              {
                q: "How are Scrizians vetted?",
                a: "Every profile goes through identity verification, skill assessment and a Scriza review before it is published on the Talent Network."
              },
              {
                q: "Can I contact talent directly?",
                a: "To protect privacy, all enquiries route through Scrizians. Our team arranges interviews and shares details once an engagement is confirmed."
              },
              {
                q: "How fast can I get a shortlist?",
                a: "Most requirements receive a curated shortlist within 48 hours."
              },
              {
                q: "Do you support international time zones?",
                a: "Yes. Scrizians commonly work with 4+ hours overlap with US, UK, EU, Middle East and APAC clients."
              }
            ].map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx} 
                  className={styles.faqItem}
                >
                  <button 
                    type="button"
                    className={styles.faqSummary}
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${idx}`}
                  >
                    <span className={styles.faqArrow} aria-hidden="true">{isOpen ? '▼' : '▶'}</span> {faq.q}
                  </button>
                  {isOpen && (
                    <p id={`faq-answer-${idx}`} className={styles.faqContent}>
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA RED BAND WITH DIAGONAL STRIPES matching media_1790938954724.png */}
      <section className={styles.ctaRedBand}>
        <div className={styles.ctaBandInner}>
          <div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.4rem' }}>Ready to build your team?</h2>
            <p style={{ fontSize: '1rem', color: '#ffffff', opacity: 0.9 }}>
              Share your requirement and receive a curated Scrizian shortlist within 48 hours.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className={styles.btnDarkNavyCTA} onClick={() => handleOpenModal()}>
              Hire Talent
            </button>
            <a href="tel:+919119112999" className={styles.btnWhiteCall}>
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
