const connectDB = require('../config/db');
const TalentProfile = require('../models/TalentProfile');
const Job = require('../models/Job');
const Article = require('../models/Article');
const CaseStudy = require('../models/CaseStudy');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  await connectDB();
  console.log('[Seeder] Resetting collections and seeding database...');

  try {
    await TalentProfile.deleteMany({});
    await Job.deleteMany({});
    await Article.deleteMany({});
    await CaseStudy.deleteMany({});
    await User.deleteMany({});

    // 1. Seed Admin User
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);
    await User.create({
      name: 'Scriza Super Admin',
      email: 'admin@scrizians.com',
      password: hashedPassword,
      role: 'admin',
      isVerified: true
    });

    // 2. Seed Talent Profiles (Anti-Bypass Protected)
    const talentProfiles = [
      {
        scrizianId: 'SZN-DEV-00001',
        displayName: 'Aarav M. (Senior Full-Stack Architect)',
        title: 'Senior Full-Stack Architect (Next.js, Node.js & Cloud)',
        summary: '8+ years of experience architecting high-scale SaaS platforms, microservices, and React/Next.js frontend applications.',
        experienceYears: 8,
        skills: ['React', 'Next.js', 'Node.js', 'TypeScript', 'MongoDB', 'AWS', 'Redis'],
        categories: ['Full Stack Developers', 'Backend Developers'],
        timezone: 'IST (UTC+5:30) / EST Overlap',
        availability: 'Immediate',
        hourlyRateUSD: 32,
        monthlyRateINR: 180000,
        relationshipBadge: 'Verified Scrizian',
        status: 'approved',
        privateEmail: 'aarav.private@gmail.com',
        privatePhone: '+91 98765 43210'
      },
      {
        scrizianId: 'SZN-DEV-00002',
        displayName: 'Priya K. (Lead UI/UX & Frontend Engineer)',
        title: 'Lead Frontend Specialist & Design Systems Architect',
        summary: '6+ years building pixel-perfect design systems, accessible React interfaces, and CSS Modules/Tailwind architectures.',
        experienceYears: 6,
        skills: ['React', 'Next.js', 'CSS Modules', 'Figma', 'TypeScript', 'Tailwind'],
        categories: ['Frontend Developers', 'UI/UX Designers'],
        timezone: 'IST (UTC+5:30)',
        availability: '1-2 Weeks',
        hourlyRateUSD: 28,
        monthlyRateINR: 150000,
        relationshipBadge: 'Scriza Team Member',
        status: 'approved',
        privateEmail: 'priya.k@scriza.in',
        privatePhone: '+91 91191 12999'
      },
      {
        scrizianId: 'SZN-DVO-00001',
        displayName: 'Rohan V. (DevOps & Site Reliability Lead)',
        title: 'DevOps Lead & Cloud Security Engineer',
        summary: '7+ years managing Kubernetes clusters, CI/CD pipelines, AWS Infrastructure-as-Code, and zero-downtime deployments.',
        experienceYears: 7,
        skills: ['DevOps', 'AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD', 'Node.js'],
        categories: ['DevOps & Cloud'],
        timezone: 'IST (UTC+5:30) / PST Overlap',
        availability: 'Immediate',
        hourlyRateUSD: 35,
        monthlyRateINR: 200000,
        relationshipBadge: 'Verified Scrizian',
        status: 'approved',
        privateEmail: 'rohan.v@devops.com',
        privatePhone: '+91 99887 76655'
      },
      {
        scrizianId: 'SZN-QA-00001',
        displayName: 'Ananya S. (Lead Automation QA Engineer)',
        title: 'Lead QA Automation Engineer (Cypress, Playwright & API)',
        summary: '5+ years creating robust automation frameworks, performance testing, and API integration suites.',
        experienceYears: 5,
        skills: ['QA Automation', 'Cypress', 'Playwright', 'Jest', 'Postman', 'JavaScript'],
        categories: ['QA Engineers'],
        timezone: 'IST (UTC+5:30)',
        availability: 'Immediate',
        hourlyRateUSD: 24,
        monthlyRateINR: 130000,
        relationshipBadge: 'Available for Hire',
        status: 'approved',
        privateEmail: 'ananya.qa@gmail.com',
        privatePhone: '+91 97766 55443'
      }
    ];
    await TalentProfile.insertMany(talentProfiles);

    // 3. Seed Jobs
    const jobs = [
      {
        title: 'Senior Next.js & Full-Stack Developer',
        slug: 'senior-nextjs-fullstack-developer',
        department: 'Engineering',
        location: 'Remote (India / Global)',
        type: 'Full-Time',
        experienceLevel: '5+ Years',
        salaryRangeINR: '₹14,00,00,0 - ₹24,00,000 / year',
        salaryRangeUSD: '$25,000 - $40,000 / year',
        description: 'We are seeking an experienced Next.js Developer to build responsive, high-performance web applications and dashboards.',
        requirements: ['5+ years with React/Next.js App Router', 'Strong Node.js & MongoDB skills', 'Experience with CSS Modules and clean component architecture'],
        responsibilities: ['Develop SSR/SSG pages with lighthouse optimization', 'Collaborate with Scriza client delivery teams', 'Maintain clean code quality and unit testing']
      },
      {
        title: 'DevOps & Cloud Security Specialist',
        slug: 'devops-cloud-security-specialist',
        department: 'Infrastructure',
        location: 'Remote (India)',
        type: 'Contract',
        experienceLevel: '6+ Years',
        salaryRangeINR: '₹18,00,000 - ₹28,00,000 / year',
        salaryRangeUSD: '$30,000 - $48,000 / year',
        description: 'Join our Cloud & Infrastructure squad to manage multi-tenant Kubernetes environments and AWS infrastructure.',
        requirements: ['Deep expertise in AWS, Terraform, Docker, and Kubernetes', 'Experience with monitoring tools (Prometheus, Grafana)', 'Strong security-first mindset'],
        responsibilities: ['Set up automated CI/CD pipelines', 'Ensure 99.99% uptime and zero-trust security controls']
      }
    ];
    await Job.insertMany(jobs);

    // 4. Seed Articles
    const articles = [
      {
        title: 'How to Hire High-Performing React & Next.js Developers from India',
        slug: 'how-to-hire-react-developers-india',
        category: 'Hiring Guides',
        summary: 'A comprehensive evaluation playbook for international tech leads seeking top-tier React engineering talent.',
        content: 'Building a high-impact engineering team requires assessing technical depth, asynchronous communication, and architectural discipline...',
        authorScrizianId: 'SZN-DEV-00001',
        authorName: 'Aarav M. (Senior Full-Stack Architect)',
        readTime: '6 min read'
      },
      {
        title: 'Multi-Tenant SaaS Architecture with Node.js and MongoDB',
        slug: 'multi-tenant-saas-architecture-nodejs-mongodb',
        category: 'SaaS Engineering',
        summary: 'Best practices for implementing tenant isolation, index optimization, and RBAC security in modern cloud applications.',
        content: 'When designing multi-tenant software platforms, data isolation and query efficiency are critical to preventing cross-tenant leakage...',
        authorScrizianId: 'SZN-DEV-00002',
        authorName: 'Priya K. (Lead UI/UX & Frontend Engineer)',
        readTime: '8 min read'
      }
    ];
    await Article.insertMany(articles);

    // 5. Seed Case Studies
    const caseStudies = [
      {
        title: 'Global Fintech Payment Processing Gateway Modernization',
        slug: 'fintech-payment-processing-modernization',
        clientIndustry: 'Fintech & Digital Banking',
        challenge: 'Legacy monolithic architecture causing latency spikes during peak transaction volumes and high infrastructure costs.',
        solution: 'Migrated backend to event-driven Node.js microservices with MongoDB sharding and Redis caching layer.',
        techStack: ['Node.js', 'Next.js', 'MongoDB', 'Redis', 'AWS Lambda'],
        outcomes: ['300% faster transaction throughput', '45% reduction in cloud infrastructure spend', 'Zero downtime during migration'],
        teamSize: 5
      }
    ];
    await CaseStudy.insertMany(caseStudies);

    console.log('[Seeder] Seeding completed successfully!');
  } catch (err) {
    console.error('[Seeder Error]', err);
  }
};

if (require.main === module) {
  seedData().then(() => process.exit(0));
}

module.exports = seedData;
