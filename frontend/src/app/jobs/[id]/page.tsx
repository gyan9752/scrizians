'use client';

import { jobApi } from '@/lib/expressApi';
import { syncFromMongoDB } from '@/utils/dataSync';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { LeadModal } from '@/components/LeadModal/LeadModal';
import { useCurrency } from '@/context/CurrencyContext';
import { PhoneInputField } from '@/components/PhoneInputField/PhoneInputField';

const jobsData: Record<string, any> = {
  'senior-react-developer': {
    title: 'Senior React Developer',
    dept: 'ENGINEERING',
    typeBadge: 'Full Time',
    location: 'Remote (India) · Remote',
    experience: '4-7 years',
    skills: ['React', 'TypeScript', 'Next.js', 'Redux', 'Tailwind'],
    salaryUSD: '$21.5k – $33.5k',
    salaryINR: '₹18,00,000 – ₹28,00,000 / year',
    description: 'We are seeking an experienced Senior React Developer to architect and deliver responsive, high-performance web applications for international client products.',
    responsibilities: [
      'Architect modular, scalable React & Next.js UI components with strict TypeScript types',
      'Optimize Web Vitals, Lighthouse scores, and client-side rendering performance',
      'Collaborate with product designers in Figma to build accessible design systems',
      'Integrate RESTful & GraphQL backend APIs with robust state management'
    ],
    requirements: [
      '4+ years of professional software development experience focused on React & TypeScript',
      'Solid expertise in Next.js App Router, SSR, SSG, and server components',
      'Experience working in remote, agile engineering teams with CI/CD deployment'
    ]
  },
  'nodejs-backend-engineer': {
    title: 'Node.js Backend Engineer',
    dept: 'ENGINEERING',
    typeBadge: 'Full Time',
    location: 'Noida, India · Hybrid',
    experience: '3-6 years',
    skills: ['Node.js', 'MongoDB', 'AWS', 'Express', 'Redis'],
    salaryUSD: '$18k – $28.7k',
    salaryINR: '₹15,00,000 – ₹24,00,000 / year',
    description: 'Join our core engineering team in Noida to build resilient, high-throughput microservices APIs using Node.js and MongoDB.',
    responsibilities: [
      'Design, build, and maintain high-throughput Node.js microservices',
      'Optimize MongoDB schema design, indexing, and query performance',
      'Implement JWT/OAuth security, rate-limiting, and error handling middleware',
      'Deploy services to AWS containerized infrastructure'
    ],
    requirements: [
      '3+ years experience with Node.js, Express, and MongoDB in production environments',
      'Strong understanding of asynchronous processing, Redis caching, and microservices',
      'Degree in Computer Science or equivalent practical experience'
    ]
  },
  'devops-engineer-contract': {
    title: 'DevOps Engineer (Contract)',
    dept: 'CLOUD',
    typeBadge: 'Contract',
    location: 'Remote · Remote',
    experience: '5+ years',
    skills: ['Kubernetes', 'Terraform', 'CI/CD', 'AWS', 'GCP'],
    salaryUSD: '$3k – $4.2k / month',
    salaryINR: '₹2,50,000 – ₹3,50,000 / month',
    description: 'Contract engagement for a Senior DevOps Engineer to automate multi-region Kubernetes deployments and Terraform IaC pipelines.',
    responsibilities: [
      'Automate infrastructure provisioning across AWS and GCP using Terraform',
      'Manage multi-region Kubernetes (EKS/GKE) cluster security and autoscaling',
      'Build GitOps CI/CD pipelines with ArgoCD and GitHub Actions'
    ],
    requirements: [
      '5+ years hands-on DevOps and Cloud Infrastructure experience',
      'Certified Kubernetes Administrator (CKA) or AWS DevOps Pro certified preferred'
    ]
  },
  'qa-automation-intern': {
    title: 'QA Automation Intern',
    dept: 'QUALITY',
    typeBadge: 'Internship',
    location: 'Noida, India · On Site',
    experience: '0-1 years',
    skills: ['Selenium', 'JavaScript', 'Playwright', 'API Testing'],
    salaryUSD: '$180 – $300 / month',
    salaryINR: '₹15,000 – ₹25,000 / month',
    description: 'Great opportunity for entry-level engineering graduates to build automated testing suites using Playwright and Selenium.',
    responsibilities: [
      'Write end-to-end regression scripts for web and mobile platforms',
      'Perform API contract testing and log bug trace reports'
    ],
    requirements: [
      'Strong basic knowledge of JavaScript/TypeScript or Python programming',
      'Passionate about software quality and test-driven development'
    ]
  },
  'ui-ux-designer': {
    title: 'UI/UX Designer',
    dept: 'DESIGN',
    typeBadge: 'Full Time',
    location: 'Remote (India) · Remote',
    experience: '3-5 years',
    skills: ['Figma', 'Design Systems', 'User Research', 'Prototyping'],
    salaryUSD: '$14.4k – $21.5k',
    salaryINR: '₹12,00,000 – ₹18,00,000 / year',
    description: 'Product designer needed to craft conversion-focused user journeys, SaaS dashboards, and design systems in Figma.',
    responsibilities: [
      'Create high-fidelity wireframes, interactive prototypes, and design systems in Figma',
      'Conduct user interviews and turn qualitative insights into intuitive product UX'
    ],
    requirements: [
      '3+ years product design experience with a strong portfolio showing web/mobile SaaS work'
    ]
  },
  'flutter-developer-part-time': {
    title: 'Flutter Developer (Part-time)',
    dept: 'MOBILE',
    typeBadge: 'Part Time',
    location: 'Remote · Remote',
    experience: '2-4 years',
    skills: ['Flutter', 'Firebase', 'Dart', 'State Management'],
    salaryUSD: '$720 – $1.1k / month',
    salaryINR: '₹60,000 – ₹90,000 / month',
    description: 'Part-time opportunity for Flutter developers to maintain and ship feature updates to cross-platform mobile apps.',
    responsibilities: [
      'Develop cross-platform mobile screens in Flutter and integrate Firebase backend APIs'
    ],
    requirements: [
      '2+ years Flutter experience with published apps on Google Play or App Store'
    ]
  }
};

import { getStoredData, initialJobsList } from '@/utils/dataSync';

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantCountryCode, setApplicantCountryCode] = useState('+91');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [scrizianId, setScrizianId] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [applyError, setApplyError] = useState('');

  const { currency } = useCurrency();

  const [jobsList, setJobsList] = useState<any[]>([]);

  React.useEffect(() => {
    const refreshData = () => {
      setJobsList(getStoredData('scrizians_jobs_list', initialJobsList));
    };
    refreshData();
    syncFromMongoDB('scrizians_jobs_list');
    window.addEventListener('scrizians_storage_updated', refreshData);
    window.addEventListener('storage', refreshData);
    return () => {
      window.removeEventListener('scrizians_storage_updated', refreshData);
      window.removeEventListener('storage', refreshData);
    };
  }, []);

  const [apiJob, setApiJob] = useState<any>(null);

  React.useEffect(() => {
    jobApi.getBySlug(params.id).then(res => {
      if (res.success && res.data) {
        setApiJob(res.data);
      }
    });
  }, [params.id]);

  const rawJob = jobsList.find(j => 
    String(j.id).toLowerCase() === String(params.id).toLowerCase() || 
    String(j.slug || '').toLowerCase() === String(params.id).toLowerCase()
  ) || apiJob || jobsData[params.id];

  const job = rawJob ? {
    title: rawJob.title,
    dept: rawJob.dept || rawJob.department || 'ENGINEERING',
    typeBadge: rawJob.typeBadge || rawJob.typeKey || rawJob.type || 'Full Time',
    location: rawJob.location || 'Remote (India / Global)',
    experience: rawJob.experience || rawJob.experienceLevel || '3-6 years',
    skills: Array.isArray(rawJob.skills) ? rawJob.skills : (Array.isArray(rawJob.requirements) ? rawJob.requirements.slice(0, 5) : String(rawJob.skills || 'React, Node.js').split(',')),
    salaryUSD: rawJob.rate || rawJob.salaryUSD || rawJob.salaryRangeUSD || '$25k – $40k',
    salaryINR: rawJob.salaryINR || rawJob.salaryRangeINR || '₹18,00,000 – ₹30,00,000 / year',
    description: rawJob.description || `We are seeking an experienced ${rawJob.title} to deliver high-performance solutions for international client products.`,
    responsibilities: rawJob.responsibilities || [
      `Architect modular, scalable ${rawJob.title} features with clean architecture`,
      'Optimize performance, security, and developer productivity',
      'Collaborate with cross-functional engineering teams in remote agile environments'
    ],
    requirements: rawJob.requirements || [
      '3+ years of professional software engineering experience',
      'Solid expertise in modern frontend, backend, or cloud infrastructure technologies',
      'Strong communication skills for daily agile standups'
    ]
  } : null;

  if (!job) {
    return (
      <>
        <Header onOpenLeadModal={() => setIsLeadModalOpen(true)} />
        <section style={{ backgroundColor: '#0A172A', color: '#ffffff', padding: '5rem 1.5rem', textAlign: 'center' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Job Opening No Longer Available</h1>
            <p style={{ color: '#94A3B8', marginBottom: '2rem' }}>This position has been filled or removed by the hiring administrator.</p>
            <Link href="/jobs" style={{ display: 'inline-block', backgroundColor: '#DC2626', color: '#ffffff', padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 600, textDecoration: 'none' }}>
              Explore Active Job Openings →
            </Link>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError('');

    const result: any = await jobApi.apply(rawJob?.slug || params.id, {
      coverLetter: `Name: ${applicantName}\nEmail: ${applicantEmail}\nPhone: ${applicantPhone}${scrizianId ? `\nScrizian ID: ${scrizianId}` : ''}`,
      resume: resumeUrl,
    });

    if (result.success) {
      setApplied(true);
    } else if (result.status === 401 || result.status === 403) {
      setApplyError('Please log in with a Candidate account to apply for this job.');
    } else {
      setApplyError(result.error || result.message || 'Could not submit your application. Please try again.');
    }
  };

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.description,
    "hiringOrganization": {
      "@type": "Organization",
      "name": "Scriza Private Limited",
      "sameAs": "https://scrizians.com"
    },
    "jobLocation": {
      "@type": "Place",
      "address": job.location
    }
  };

  return (
    <>
      <Header onOpenLeadModal={() => setIsLeadModalOpen(true)} />
      
      {/* Inject Google JobPosting JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Header */}
      <section style={{ backgroundColor: '#0A172A', color: '#ffffff', padding: '3.5rem 1.5rem 4.5rem' }}>
        <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
          <div style={{ fontSize: '0.88rem', color: '#94A3B8', marginBottom: '1.5rem' }}>
            <Link href="/" style={{ color: '#94A3B8', textDecoration: 'none' }}>Home</Link> / <Link href="/jobs" style={{ color: '#94A3B8', textDecoration: 'none' }}>Jobs</Link> / {job.title}
          </div>

          <span style={{ color: '#F87171', fontSize: '0.82rem', fontWeight: 800, letterSpacing: '1.4px', textTransform: 'uppercase', display: 'block', marginBottom: '0.8rem' }}>
            {job.dept} · {job.typeBadge}
          </span>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', lineHeight: 1.15 }}>
            {job.title}
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#94A3B8', maxWidth: '680px', lineHeight: 1.6 }}>
            📍 {job.location} · 💼 {job.experience} · 💰 {currency === 'USD' ? job.salaryUSD : job.salaryINR}
          </p>
        </div>
      </section>

      {/* Main Details & Application Form */}
      <main style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '4rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '3.5rem', alignItems: 'start' }}>
          
          {/* Left Description Column */}
          <div>
            <div style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.8rem' }}>Role Description</h2>
              <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.7 }}>{job.description}</p>
            </div>

            {job.responsibilities && (
              <div style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.8rem' }}>Key Responsibilities</h2>
                <ul style={{ paddingLeft: '1.2rem', fontSize: '1rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.6rem', lineHeight: 1.6 }}>
                  {job.responsibilities.map((resp: string, idx: number) => (
                    <li key={idx}>{resp}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.8rem' }}>Requirements & Qualifications</h2>
              <ul style={{ paddingLeft: '1.2rem', fontSize: '1rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.6rem', lineHeight: 1.6 }}>
                {job.requirements.map((req: string, idx: number) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Application Box */}
          <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', padding: '2rem', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.4rem' }}>Apply for this position</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem' }}>
              Submit your application in 1 minute. No account creation required.
            </p>

            {applied ? (
              <div style={{ background: '#DCFCE7', color: '#15803D', padding: '1.2rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.5 }}>
                🎉 Application Submitted Successfully! Our talent acquisition team will review your application and respond within 24 hours.
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {applyError && (
                  <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '0.8rem 1rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem' }}>
                    {applyError} <a href="/login" style={{ color: '#B91C1C', textDecoration: 'underline' }}>Login</a>
                  </div>
                )}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.3rem' }}>Full Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Aarav Sharma"
                    value={applicantName}
                    onChange={e => setApplicantName(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0', border: 'none', borderBottom: '2px solid #E2E8F0', borderRadius: 0, fontSize: '0.92rem', fontWeight: 600, color: '#0F172A', outline: 'none', background: 'transparent' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.3rem' }}>Email Address *</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="aarav@example.com"
                    value={applicantEmail}
                    onChange={e => setApplicantEmail(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0', border: 'none', borderBottom: '2px solid #E2E8F0', borderRadius: 0, fontSize: '0.92rem', fontWeight: 600, color: '#0F172A', outline: 'none', background: 'transparent' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.3rem' }}>Phone / WhatsApp *</label>
                  <PhoneInputField
                    value={applicantPhone}
                    onChange={(val) => setApplicantPhone(val)}
                    placeholder="98765 43210"
                    variant="underline"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.3rem' }}>Scrizian ID (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. SCR-8841"
                    value={scrizianId}
                    onChange={e => setScrizianId(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0', border: 'none', borderBottom: '2px solid #E2E8F0', borderRadius: 0, fontSize: '0.92rem', fontWeight: 600, color: '#0F172A', outline: 'none', background: 'transparent' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.3rem' }}>Resume / Portfolio URL *</label>
                  <input 
                    type="url" 
                    required 
                    placeholder="https://linkedin.com/in/... or drive link"
                    value={resumeUrl}
                    onChange={e => setResumeUrl(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0', border: 'none', borderBottom: '2px solid #E2E8F0', borderRadius: 0, fontSize: '0.92rem', fontWeight: 600, color: '#0F172A', outline: 'none', background: 'transparent' }}
                  />
                </div>

                <button 
                  type="submit" 
                  style={{ background: '#E52B2B', color: '#ffffff', padding: '0.85rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.95rem', border: 'none', cursor: 'pointer', marginTop: '0.5rem' }}
                >
                  Submit Application →
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <LeadModal isOpen={isLeadModalOpen} onClose={() => setIsLeadModalOpen(false)} />
      <Footer />
    </>
  );
}
