'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { TalentCard, Talent } from '@/components/TalentCard/TalentCard';
import { LeadModal } from '@/components/LeadModal/LeadModal';
import { PhoneInputField } from '@/components/PhoneInputField/PhoneInputField';
import { useCurrency } from '@/context/CurrencyContext';
import { talentApi } from '@/lib/expressApi';
import { adaptTalent } from '@/lib/adapters';
import { addInboundLead } from '@/utils/dataSync';
import styles from './HireTalent.module.css';

interface RoleDefinition {
  id: string;
  label: string;
  headline: string;
  description: string;
  skills: string[];
  startingUSD: number;
  startingINR: number;
  categoryFilter: string;
}

const ROLES: RoleDefinition[] = [
  {
    id: 'frontend',
    label: 'Frontend Developers',
    headline: 'Hire Top Frontend Developers from India',
    description: 'Ship fast, accessible, and reactive web applications using modern React, Next.js, Vue, and TypeScript. All engineers are vetted for Clean Code, Lighthouse 95+ performance, and Figma design system fidelity.',
    skills: ['React', 'Next.js', 'TypeScript', 'TailwindCSS', 'Redux', 'GraphQL'],
    startingUSD: 22,
    startingINR: 180000,
    categoryFilter: 'Frontend Developers'
  },
  {
    id: 'backend',
    label: 'Backend Developers',
    headline: 'Hire Senior Backend Developers from India',
    description: 'Architect resilient microservices, high-throughput REST and gRPC APIs, and optimized databases using Node.js, Python, Java, and Go for global scale.',
    skills: ['Node.js', 'Python', 'Java', 'PostgreSQL', 'MongoDB', 'Redis', 'Kafka'],
    startingUSD: 25,
    startingINR: 190000,
    categoryFilter: 'Backend Developers'
  },
  {
    id: 'fullstack',
    label: 'Full Stack Developers',
    headline: 'Hire Full Stack Product Engineers from India',
    description: 'End-to-end software engineers comfortable from database architecture to responsive UI. Ideal for fast-moving startups and product teams.',
    skills: ['Next.js', 'Node.js', 'Python', 'AWS', 'TypeScript', 'Docker'],
    startingUSD: 28,
    startingINR: 210000,
    categoryFilter: 'Full Stack Developers'
  },
  {
    id: 'qa',
    label: 'QA Engineers',
    headline: 'Hire QA & Test Automation Engineers from India',
    description: 'Manual and automated quality assurance engineers who build robust end-to-end regression suites with Playwright, Cypress, and Selenium.',
    skills: ['Playwright', 'Cypress', 'Selenium', 'Postman', 'Jest', 'API Testing'],
    startingUSD: 20,
    startingINR: 150000,
    categoryFilter: 'QA Engineers'
  },
  {
    id: 'devops',
    label: 'DevOps & Cloud',
    headline: 'Hire Cloud & DevOps Specialists from India',
    description: 'Multi-cloud architects and CI/CD engineers specializing in Kubernetes, Terraform IaC, AWS, GCP, and GitOps zero-downtime deployments.',
    skills: ['Kubernetes', 'Terraform', 'AWS', 'GCP', 'Docker', 'ArgoCD'],
    startingUSD: 30,
    startingINR: 240000,
    categoryFilter: 'DevOps Engineers'
  },
  {
    id: 'uiux',
    label: 'UI/UX Designers',
    headline: 'Hire Principal UI/UX Designers from India',
    description: 'Product designers who create conversion-focused user journeys, Figma design tokens, interactive prototypes, and scalable B2B dashboards.',
    skills: ['Figma', 'Design Systems', 'Prototyping', 'User Research', 'Tokens'],
    startingUSD: 24,
    startingINR: 180000,
    categoryFilter: 'UI/UX Designers'
  },
  {
    id: 'mobile',
    label: 'Mobile Developers',
    headline: 'Hire Cross-Platform Mobile Developers from India',
    description: 'Store-ready mobile engineers building iOS and Android applications using Flutter, React Native, Swift, and Kotlin with BLE and offline sync.',
    skills: ['Flutter', 'React Native', 'iOS', 'Android', 'Firebase', 'BLE Sync'],
    startingUSD: 26,
    startingINR: 195000,
    categoryFilter: 'Mobile Developers'
  },
  {
    id: 'data-ai',
    label: 'Data & AI Specialists',
    headline: 'Hire Data & Generative AI Specialists from India',
    description: 'Machine learning and LLM practitioners delivering production RAG systems, vector embeddings, fine-tuning, and automated agent workflows.',
    skills: ['Python', 'LangChain', 'FastAPI', 'PyTorch', 'Pinecone', 'OpenAI'],
    startingUSD: 35,
    startingINR: 260000,
    categoryFilter: 'Data & AI Specialists'
  },
  {
    id: 'seo-digital',
    label: 'SEO & Digital',
    headline: 'Hire Technical SEO & Digital Growth Specialists',
    description: 'Engineers who combine technical SEO audits, Core Web Vitals optimization, programmatic metadata, and international search indexing.',
    skills: ['Technical SEO', 'GA4', 'Core Web Vitals', 'Schema Markup', 'Content'],
    startingUSD: 18,
    startingINR: 140000,
    categoryFilter: 'SEO & Digital Talent'
  }
];

function HireTalentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { formatPrice, currency } = useCurrency();

  const currentRoleParam = searchParams.get('role') || 'frontend';
  const [selectedRole, setSelectedRole] = useState(currentRoleParam);

  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedScrizianId, setSelectedScrizianId] = useState<string | undefined>(undefined);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Quick Requirement Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState('Frontend Developers');
  const [formEngagement, setFormEngagement] = useState('Dedicated Developer (Full-time)');
  const [formTimeline, setFormTimeline] = useState('Immediate (Within 48 hrs)');
  const [formNotes, setFormNotes] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Talent Data State
  const [talentList, setTalentList] = useState<any[]>([]);

  useEffect(() => {
    talentApi.getAll('limit=50').then(res => {
      if (res.success && Array.isArray(res.data)) {
        const list = res.data.map(adaptTalent);
        setTalentList(list);
      }
    });
  }, []);

  useEffect(() => {
    const r = searchParams.get('role');
    if (r && ROLES.some(role => role.id === r)) {
      setSelectedRole(r);
    }
  }, [searchParams]);

  const activeRole = useMemo(() => {
    return ROLES.find(r => r.id === selectedRole) || ROLES[0];
  }, [selectedRole]);

  // Filter 2-3 Spotlight Talents matching the active role
  const spotlightTalents = useMemo(() => {
    const qRole = activeRole.id.toLowerCase();
    const catName = activeRole.categoryFilter.toLowerCase();

    const matches = talentList.filter(t => {
      const tRole = String(t.category || t.role || '').toLowerCase();
      const tTitle = String(t.title || '').toLowerCase();
      return (
        tRole.includes(catName) ||
        tRole.includes(qRole) ||
        tTitle.includes(qRole) ||
        (qRole === 'frontend' && (tTitle.includes('react') || tTitle.includes('frontend'))) ||
        (qRole === 'backend' && (tTitle.includes('node') || tTitle.includes('java') || tTitle.includes('python'))) ||
        (qRole === 'mobile' && (tTitle.includes('flutter') || tTitle.includes('mobile'))) ||
        (qRole === 'devops' && (tTitle.includes('devops') || tTitle.includes('cloud') || tTitle.includes('kubernetes'))) ||
        (qRole === 'uiux' && (tTitle.includes('designer') || tTitle.includes('ui/ux'))) ||
        (qRole === 'data-ai' && (tTitle.includes('ai') || tTitle.includes('data') || tTitle.includes('ml')))
      );
    });

    const fallbackSource = matches.length > 0 ? matches : talentList;
    return fallbackSource.slice(0, 3).map(t => ({
      scrizianId: t.id || t.scrizianId,
      displayName: t.displayName || t.name,
      title: t.title,
      category: t.category || activeRole.label,
      summary: t.summary || `${t.experienceYears || 7}+ years experience in ${activeRole.label}.`,
      experienceYears: t.experienceYears || 7,
      skills: Array.isArray(t.skills) ? t.skills : String(t.skills || '').split(',').map((s: string) => s.trim()),
      availability: t.availability || 'Available now',
      hourlyRateUSD: Number(t.hourlyRateUSD || activeRole.startingUSD),
      monthlyRateINR: Number(t.monthlyRateINR || activeRole.startingINR),
      relationshipBadge: t.relationshipBadge || 'Verified Scrizian',
      avatarText: (t.id || t.scrizianId || '00').replace(/[^0-9]/g, '').slice(-2) || '00'
    }));
  }, [activeRole, talentList]);

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setFormRole(ROLES.find(r => r.id === roleId)?.label || 'Frontend Developers');
    router.push(`/hire-talent?role=${roleId}`, { scroll: false });
  };

  const handleOpenLeadModal = (scrizianId?: string) => {
    setSelectedScrizianId(scrizianId);
    setIsLeadModalOpen(true);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleRequirementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);

    try {
      const payload = {
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        company: 'Client Hiring Requirement',
        serviceRequested: `${formRole} — ${formEngagement}`,
        message: `Timeline: ${formTimeline}\nRole Needed: ${formRole}\nEngagement: ${formEngagement}\nNotes: ${formNotes}`
      };

      const res: any = await addInboundLead(payload);
      if (res?.success) {
        showToast('Requirement submitted successfully! Scrizians team will send curated profiles within 48 hrs.');
        setFormName('');
        setFormEmail('');
        setFormPhone('');
        setFormNotes('');
      } else {
        showToast(res?.error || res?.message || 'Could not submit requirement. Please try again.');
      }
    } catch (err) {
      showToast('Network error. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <>
      <Header onOpenLeadModal={() => handleOpenLeadModal()} />

      {/* Floating Status Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: '#0B172A',
          color: '#ffffff',
          padding: '0.9rem 1.4rem',
          borderRadius: '10px',
          zIndex: 999999,
          fontWeight: 700,
          fontSize: '0.92rem',
          border: '1px solid rgba(229, 43, 43, 0.5)',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 0 20px rgba(229, 43, 43, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem'
        }}>
          <span>⚡</span>
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer', marginLeft: '0.5rem' }}>×</button>
        </div>
      )}

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroRingWrapper}>
          <div className={styles.heroRing} />
        </div>

        <div className={styles.heroInner}>
          <div className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>Home</Link> / Hire Talent
          </div>

          <span className={styles.eyebrow}>HIRE TECH TALENT</span>
          <h1 className={styles.title}>Build Your Team with Curated Tech Talent from India</h1>
          <p className={styles.subtitle}>
            Pre-vetted developers, designers, QA engineers, DevOps professionals and digital specialists ready for staff augmentation, dedicated teams, or remote engagements.
          </p>

          <div className={styles.heroCtas}>
            <button className={styles.btnPrimary} onClick={() => {
              const el = document.getElementById('requirement-builder');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
              else handleOpenLeadModal();
            }}>
              Post a Requirement →
            </button>
            <Link href="/talent" className={styles.btnSecondary}>
              Explore Full Talent Network
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Value Bar (Task 1 & Task 5) */}
      <section className={styles.trustBar}>
        <div className={styles.trustGrid}>
          <div className={styles.trustItem}>
            <span className={styles.trustIcon}>⏱️</span>
            <div>
              <strong>48-Hour Shortlists</strong>
              <p>Receive verified, matching profiles in two business days.</p>
            </div>
          </div>
          <div className={styles.trustItem}>
            <span className={styles.trustIcon}>🛡️</span>
            <div>
              <strong>1-Week Risk-Free Trial</strong>
              <p>Evaluate your developer in real sprints before committing.</p>
            </div>
          </div>
          <div className={styles.trustItem}>
            <span className={styles.trustIcon}>✅</span>
            <div>
              <strong>Pre-Vetted Top 3%</strong>
              <p>Rigorous coding evaluations and architecture vetting.</p>
            </div>
          </div>
          <div className={styles.trustItem}>
            <span className={styles.trustIcon}>🔒</span>
            <div>
              <strong>100% IP & NDA Protected</strong>
              <p>Direct code ownership with Scriza enterprise governance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Role Selector Nav Bar (Task 5: Core Commercial Pages) */}
      <nav className={styles.roleSelectorNav} aria-label="Hire by Role">
        <div className={styles.roleSelectorInner}>
          {ROLES.map(role => {
            const isActive = selectedRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => handleRoleSelect(role.id)}
                className={`${styles.roleTabBtn} ${isActive ? styles.roleTabBtnActive : ''}`}
                aria-pressed={isActive}
              >
                {role.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Active Role Overview & Spotlight Profiles */}
      <section className={styles.section} style={{ background: '#F8FAFC' }}>
        <div className={styles.sectionInner}>
          
          {/* Intent Card */}
          <div className={styles.intentCard}>
            <div className={styles.intentDetails}>
              <span className={styles.eyebrow} style={{ color: '#E52B2B' }}>HIRE BY DISCIPLINE</span>
              <h3>{activeRole.headline}</h3>
              <p>{activeRole.description}</p>
              
              <div className={styles.intentSkillsList}>
                {activeRole.skills.map((skill, idx) => (
                  <span key={idx} className={styles.skillChip}>{skill}</span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => handleOpenLeadModal()}
                  className={styles.btnPrimary}
                  style={{ fontSize: '0.92rem', padding: '0.75rem 1.4rem' }}
                >
                  Hire {activeRole.label} →
                </button>
                <Link 
                  href={`/talent?q=${encodeURIComponent(activeRole.label)}`} 
                  style={{ color: '#0F172A', fontWeight: 700, fontSize: '0.92rem', display: 'inline-flex', alignItems: 'center', textDecoration: 'none', padding: '0.75rem 0' }}
                >
                  View all in Talent Directory ↗
                </Link>
              </div>
            </div>

            <div className={styles.intentStatsBox}>
              <div className={styles.intentStatRow}>
                <span className={styles.intentStatLabel}>Starting Rates</span>
                <span className={styles.intentStatVal}>{formatPrice(activeRole.startingUSD, activeRole.startingINR, 'hr')}</span>
              </div>
              <div className={styles.intentStatRow}>
                <span className={styles.intentStatLabel}>Shortlist Turnaround</span>
                <span className={styles.intentStatVal}>Within 48 Hours</span>
              </div>
              <div className={styles.intentStatRow}>
                <span className={styles.intentStatLabel}>Timezone Overlap</span>
                <span className={styles.intentStatVal}>4+ Hours Daily</span>
              </div>
              <div className={styles.intentStatRow}>
                <span className={styles.intentStatLabel}>Trial Period</span>
                <span className={styles.intentStatVal}>1-Week Risk-Free</span>
              </div>
            </div>
          </div>

          {/* Spotlight Talent Cards Header */}
          <div className={styles.sectionHeaderRow}>
            <div>
              <span className={styles.eyebrow} style={{ color: '#E52B2B' }}>CURATED SPOTLIGHT</span>
              <h2 className={styles.sectionTitle}>Sample Verified {activeRole.label}</h2>
              <p className={styles.sectionSubtitle}>
                Profiles show Scrizian ID, technical experience, and indicative rates. Contact details remain confidential.
              </p>
            </div>
          </div>

          {/* 3 Spotlight Cards */}
          <div className={styles.spotlightGrid}>
            {spotlightTalents.map((talent: Talent) => (
              <TalentCard 
                key={talent.scrizianId} 
                talent={talent} 
                onSelectLeadModal={(id) => handleOpenLeadModal(id)}
              />
            ))}
          </div>

          {/* Explore Full Directory Link */}
          <div className={styles.exploreFullBanner}>
            <span>
              Looking for a specific tech stack or seniority? Search over all verified tech professionals in the directory.
            </span>
            <Link href="/talent">
              Browse Entire Talent Network →
            </Link>
          </div>

        </div>
      </section>

      {/* 4-Step Vetting & Screening Process (Task 5: Screening process) */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <span className={styles.eyebrow} style={{ color: '#E52B2B' }}>THE SCRIZIAN STANDARD</span>
            <h2 className={styles.sectionTitle}>How We Vet & Verify Tech Talent</h2>
            <p className={styles.sectionSubtitle}>
              Fewer than 3% of applicants pass our 4-stage evaluation before being presented on the Scrizians network.
            </p>
          </div>

          <div className={styles.processGrid}>
            <div className={styles.processCard}>
              <span className={styles.processStepNum}>01</span>
              <h3>Technical Code Review</h3>
              <p>Algorithmic problem-solving, architectural standards, test coverage, and clean coding practices evaluated by senior architects.</p>
            </div>

            <div className={styles.processCard}>
              <span className={styles.processStepNum}>02</span>
              <h3>System Design & Architecture</h3>
              <p>Live technical scenario interviews assessing scalability, database design, caching strategies, and fault tolerance.</p>
            </div>

            <div className={styles.processCard}>
              <span className={styles.processStepNum}>03</span>
              <h3>English & Communication</h3>
              <p>Evaluated for daily agile standups, asynchronous pull request documentation, and frictionless remote collaboration.</p>
            </div>

            <div className={styles.processCard}>
              <span className={styles.processStepNum}>04</span>
              <h3>Identity & NDA Compliance</h3>
              <p>Comprehensive identity verification, work history checks, and binding NDA agreements ensuring 100% client IP transfer.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Engagement Models (Task 5: Engagement options) */}
      <section className={styles.section} style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeaderRow}>
            <div>
              <span className={styles.eyebrow} style={{ color: '#E52B2B' }}>ENGAGEMENT MODELS</span>
              <h2 className={styles.sectionTitle}>Flexible Ways to Hire</h2>
              <p className={styles.sectionSubtitle}>
                Scale from a single specialist developer to a complete managed offshore engineering team.
              </p>
            </div>
            <Link href="/pricing" className={styles.btnPrimary} style={{ background: '#0F172A' }}>
              View Transparent Pricing →
            </Link>
          </div>

          <div className={styles.modelsGrid}>
            <div className={styles.modelCard}>
              <div>
                <h3>Staff Augmentation</h3>
                <p>Add vetted individual developers directly into your internal engineering sprints.</p>
              </div>
              <div className={styles.modelPriceBox}>
                <span className={styles.startingLabel}>STARTING FROM</span>
                <div className={styles.priceVal}>{formatPrice(2400, 190000, 'mo')}</div>
              </div>
            </div>

            <div className={styles.modelCard}>
              <div>
                <h3>Dedicated Developer</h3>
                <p>100% full-time allocation (160h/month) dedicated exclusively to your product roadmap.</p>
              </div>
              <div className={styles.modelPriceBox}>
                <span className={styles.startingLabel}>STARTING FROM</span>
                <div className={styles.priceVal}>{formatPrice(2800, 220000, 'mo')}</div>
              </div>
            </div>

            <div className={styles.modelCard}>
              <div>
                <h3>Dedicated Pod / Team</h3>
                <p>A self-governing agile squad with a Lead Architect, Frontend/Backend engineers, and QA.</p>
              </div>
              <div className={styles.modelPriceBox}>
                <span className={styles.startingLabel}>STARTING FROM</span>
                <div className={styles.priceVal}>{formatPrice(9500, 750000, 'mo')}</div>
              </div>
            </div>

            <div className={styles.modelCard}>
              <div>
                <h3>Managed Offshore Center</h3>
                <p>A turnkey Offshore Development Center (ODC) in India fully operated and governed by Scriza.</p>
              </div>
              <div className={styles.modelPriceBox}>
                <span className={styles.startingLabel}>STARTING FROM</span>
                <div className={styles.priceVal}>{formatPrice(15000, 1200000, 'mo')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Timezone Overlap (Task 5: Timezone/communication information) */}
      <section className={styles.section} style={{ background: '#0B172A', color: '#ffffff' }}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <span className={styles.eyebrow}>GLOBAL DELIVERY</span>
            <h2 className={styles.sectionTitle} style={{ color: '#ffffff' }}>Timezone-Aligned Remote Collaboration</h2>
            <p className={styles.sectionSubtitle} style={{ color: '#94A3B8' }}>
              Our Indian engineering talent works with dedicated daily overlap across US, European, Middle East, and APAC timezones.
            </p>
          </div>

          <div className={styles.timezoneGrid}>
            <div className={styles.timezoneCard}>
              <span className={styles.tzRegion}>NORTH AMERICA</span>
              <div className={styles.tzZone}>EST / PST</div>
              <p className={styles.tzOverlap}>Dedicated morning overlap for sprint standups, planning, and code reviews.</p>
              <span className={styles.tzHours}>4+ Hours Daily Overlap</span>
            </div>

            <div className={styles.timezoneCard}>
              <span className={styles.tzRegion}>UK & EUROPE</span>
              <div className={styles.tzZone}>GMT / CET</div>
              <p className={styles.tzOverlap}>Substantial business-hour synchronicity for real-time team collaboration.</p>
              <span className={styles.tzHours}>5+ Hours Daily Overlap</span>
            </div>

            <div className={styles.timezoneCard}>
              <span className={styles.tzRegion}>MIDDLE EAST</span>
              <div className={styles.tzZone}>GST (Gulf Standard)</div>
              <p className={styles.tzOverlap}>Near-complete working day alignment with Dubai, Riyadh, and Doha teams.</p>
              <span className={styles.tzHours}>6+ Hours Daily Overlap</span>
            </div>

            <div className={styles.timezoneCard}>
              <span className={styles.tzRegion}>APAC & AUSTRALIA</span>
              <div className={styles.tzZone}>SGT / AEST</div>
              <p className={styles.tzOverlap}>Same-day agile sync and delivery for Singapore, Tokyo, and Sydney clients.</p>
              <span className={styles.tzHours}>5+ Hours Daily Overlap</span>
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies Teasers (Task 5: Relevant case studies) */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeaderRow}>
            <div>
              <span className={styles.eyebrow} style={{ color: '#E52B2B' }}>PROVEN OUTCOMES</span>
              <h2 className={styles.sectionTitle}>What Scrizians Have Shipped</h2>
              <p className={styles.sectionSubtitle}>Real client projects delivered by our curated engineering pods.</p>
            </div>
            <Link href="/case-studies" className={styles.btnSecondary} style={{ color: '#0F172A', borderColor: '#CBD5E1' }}>
              All Case Studies →
            </Link>
          </div>

          <div className={styles.caseGrid}>
            <Link href="/case-studies/uk-health-tech-app-launched-in-14-weeks" className={styles.caseCard}>
              <div className={styles.caseMedia} style={{ backgroundImage: `url('https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=75')` }}>
                <span className={styles.caseTag}>Healthcare · United Kingdom</span>
              </div>
              <div className={styles.caseBody}>
                <h3>UK Health-Tech App Launched in 14 Weeks</h3>
                <p>Dedicated Flutter and Laravel Scrizians built a HIPAA-compliant tele-consultation app from concept to App Store launch.</p>
              </div>
              <div className={styles.caseMetricsRow}>
                <div>
                  <span className={styles.metricNum}>14 wks</span>
                  <span className={styles.metricLabel}>Time to Launch</span>
                </div>
                <div>
                  <span className={styles.metricNum}>4.7 ★</span>
                  <span className={styles.metricLabel}>App Rating</span>
                </div>
                <div>
                  <span className={styles.metricNum}>99.6%</span>
                  <span className={styles.metricLabel}>Crash-free</span>
                </div>
              </div>
            </Link>

            <Link href="/case-studies/uae-retailer-cuts-qa-cycle-from-5-days-to-6-hours" className={styles.caseCard}>
              <div className={styles.caseMedia} style={{ backgroundImage: `url('https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=75')` }}>
                <span className={styles.caseTag}>E-Commerce · UAE</span>
              </div>
              <div className={styles.caseBody}>
                <h3>UAE Retailer Cuts QA Cycle from 5 Days to 6 Hours</h3>
                <p>Scrizian QA Automation engineers built parallelized Playwright suites integrated with CI/CD to eliminate manual release bottlenecks.</p>
              </div>
              <div className={styles.caseMetricsRow}>
                <div>
                  <span className={styles.metricNum}>-95%</span>
                  <span className={styles.metricLabel}>Regression Time</span>
                </div>
                <div>
                  <span className={styles.metricNum}>82%</span>
                  <span className={styles.metricLabel}>Test Coverage</span>
                </div>
                <div>
                  <span className={styles.metricNum}>-70%</span>
                  <span className={styles.metricLabel}>Escaped Bugs</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Requirement Post Form / Wizard (Task 5 & Task 14) */}
      <section id="requirement-builder" className={styles.section} style={{ background: '#F8FAFC' }}>
        <div className={styles.sectionInner}>
          <div className={styles.requirementCard}>
            <div style={{ maxWidth: '700px' }}>
              <span className={styles.eyebrow} style={{ color: '#E52B2B' }}>START IN 48 HOURS</span>
              <h2 className={styles.sectionTitle}>Share Your Hiring Requirement</h2>
              <p className={styles.sectionSubtitle}>
                Tell us the role, skills, and engagement model you need. Our technical team will curate matched profiles within 2 business days.
              </p>
            </div>

            <form onSubmit={handleRequirementSubmit} className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Your Full Name *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Sarah Jenkins"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Work Email *</label>
                <input 
                  type="email" 
                  required 
                  placeholder="sarah@company.com"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone / WhatsApp *</label>
                <PhoneInputField 
                  value={formPhone}
                  onChange={val => setFormPhone(val)}
                  placeholder="98765 43210"
                  variant="default"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Role Needed *</label>
                <select 
                  value={formRole}
                  onChange={e => setFormRole(e.target.value)}
                  className={styles.formSelect}
                >
                  {ROLES.map(r => (
                    <option key={r.id} value={r.label}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Engagement Model *</label>
                <select 
                  value={formEngagement}
                  onChange={e => setFormEngagement(e.target.value)}
                  className={styles.formSelect}
                >
                  <option value="Dedicated Developer (Full-time)">Dedicated Developer (Full-time 160h/mo)</option>
                  <option value="Part-time Developer">Part-time Developer (20h/wk)</option>
                  <option value="Staff Augmentation">Staff Augmentation</option>
                  <option value="Dedicated Team / Pod">Dedicated Team / Pod</option>
                  <option value="Hourly Specialist">Hourly Specialist</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Target Start Date *</label>
                <select 
                  value={formTimeline}
                  onChange={e => setFormTimeline(e.target.value)}
                  className={styles.formSelect}
                >
                  <option value="Immediate (Within 48 hrs)">Immediate (Within 48 hrs)</option>
                  <option value="Within 1-2 Weeks">Within 1-2 Weeks</option>
                  <option value="Next Month">Next Month</option>
                  <option value="Planning / Exploratory">Planning / Exploratory</option>
                </select>
              </div>

              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>Project Details & Key Tech Requirements</label>
                <textarea 
                  rows={4}
                  placeholder="Describe your tech stack, product requirements, or team setup..."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className={styles.formTextarea}
                />
              </div>

              <div className={styles.formGroupFull}>
                <button 
                  type="submit" 
                  disabled={formSubmitting}
                  className={styles.btnSubmitReq}
                >
                  {formSubmitting ? 'Submitting Requirement...' : 'Request Curated Shortlist (48h) →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Hiring FAQs Accordion (Task 5: FAQs for page intent) */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.faqGrid}>
            <div>
              <span className={styles.eyebrow} style={{ color: '#E52B2B' }}>CLIENT FAQ</span>
              <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
              <p className={styles.sectionSubtitle}>
                Everything you need to know about hiring through the Scrizians network.
              </p>
              <div style={{ marginTop: '1.5rem' }}>
                <a href="tel:+919119112999" style={{ color: '#0F172A', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📞 Call our hiring desk at +91 91191 12999
                </a>
              </div>
            </div>

            <div>
              {[
                {
                  q: "How quickly can we receive candidate profiles and start?",
                  a: "Most client requirements receive a curated shortlist of 2 to 4 verified Scrizian profiles within 48 business hours. Once you select a candidate after interviews, onboarding can begin within 2 to 5 business days."
                },
                {
                  q: "How does the 1-week risk-free trial work?",
                  a: "For full-time dedicated developers, we offer a 1-week evaluation period. If you are not completely satisfied with the developer's velocity, code quality, or communication, you pay nothing."
                },
                {
                  q: "Who owns the code and intellectual property (IP)?",
                  a: "You own 100% of all intellectual property, source code, repositories, and documentation. All engagements are backed by legally binding non-disclosure (NDA) and IP assignment contracts governed by Scriza Private Limited."
                },
                {
                  q: "What happens if a developer doesn't fit our team?",
                  a: "Scriza provides a replacement guarantee. If a developer needs to be replaced at any point, our team will provide a new curated shortlist within 48 hours with zero interruption to your contract terms."
                },
                {
                  q: "How do we communicate with our hired developers?",
                  a: "Directly through your company's existing tools: Slack, Microsoft Teams, GitHub, GitLab, Jira, and Google Meet. Scrizians seamlessly integrate into your daily agile workflow."
                }
              ].map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className={styles.faqItem}>
                    <button 
                      type="button"
                      className={styles.faqSummary}
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                    >
                      <span className={styles.faqArrow}>{isOpen ? '▼' : '▶'}</span>
                      {faq.q}
                    </button>
                    {isOpen && (
                      <p className={styles.faqAnswer}>{faq.a}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Red CTA Band (Task 5: Strong lead CTA) */}
      <section className={styles.ctaBand}>
        <div className={styles.ctaInner}>
          <div>
            <h2>Ready to build your team with Scrizians?</h2>
            <p>Share your requirement and receive a curated Scrizian shortlist within 48 hours.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className={styles.btnDarkNavy} onClick={() => handleOpenLeadModal()}>
              Hire Talent Now
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

export default function HireTalentPage() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>Loading Hire Talent...</div>}>
      <HireTalentContent />
    </Suspense>
  );
}

