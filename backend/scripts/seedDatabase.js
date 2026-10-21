/**
 * Scrizians MongoDB Production Database Seeder
 * Populates verified talent, published articles, case studies,
 * portfolios, jobs, and pricing configurations.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const TalentProfile = require('../src/models/TalentProfile');
const Author = require('../src/models/Author');
const Article = require('../src/models/Article');
const CaseStudy = require('../src/models/CaseStudy');
const Portfolio = require('../src/models/Portfolio');
const Job = require('../src/models/Job');
const PricingConfig = require('../src/models/PricingConfig');
const CurrencyConfig = require('../src/models/CurrencyConfig');

async function seed() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI is not set in backend/.env');
    process.exit(1);
  }

  console.log('[Seeder] Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('[Seeder] Connected successfully.');

  // 1. Get or create super admin user
  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('Admin@123456', 12);
    admin = await User.create({
      name: 'Scriza Super Admin',
      email: 'admin@scrizians.com',
      password: hashedPassword,
      role: 'admin',
      isVerified: true
    });
    console.log('[Seeder] Created super admin user: admin@scrizians.com');
  } else {
    console.log('[Seeder] Found existing admin:', admin.email);
  }

  // 2. Author Profile
  let author = await Author.findOne({ user: admin._id });
  if (!author) {
    author = await Author.create({
      user: admin._id,
      displayName: 'Scrizians Editorial & Engineering Guild',
      bio: 'Technical architects, talent partners, and engineering leadership at Scriza.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      expertise: ['Full-Stack Architecture', 'Cloud Infrastructure', 'Tech Hiring', 'Distributed Systems'],
      designation: 'Editorial Guild',
      status: 'Approved'
    });
    console.log('[Seeder] Created Author profile.');
  }

  // 3. Currency Configurations
  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar', active: true, displayOrder: 1, updatedBy: admin._id },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', active: true, displayOrder: 2, updatedBy: admin._id }
  ];
  for (const c of currencies) {
    await CurrencyConfig.findOneAndUpdate({ code: c.code }, c, { upsert: true, new: true });
  }
  console.log('[Seeder] Currencies seeded.');

  // 4. Pricing Configurations
  const pricingConfigs = [
    {
      engagementType: 'Hourly Talent',
      billingUnit: 'Hourly',
      inr: { from: 1200, to: 2500 },
      usd: { from: 18, to: 35 },
      displayLabel: 'Flexible On-Demand',
      indicative: true,
      active: true,
      updatedBy: admin._id
    },
    {
      engagementType: 'Part-Time Resource',
      billingUnit: 'Monthly',
      inr: { from: 60000, to: 110000 },
      usd: { from: 750, to: 1400 },
      displayLabel: '20 Hrs / Week Dedicated',
      indicative: true,
      active: true,
      updatedBy: admin._id
    },
    {
      engagementType: 'Dedicated Developer',
      billingUnit: 'Monthly',
      inr: { from: 120000, to: 190000 },
      usd: { from: 1500, to: 2400 },
      displayLabel: 'Full-Time 160h / Mo (Most Popular)',
      indicative: true,
      active: true,
      updatedBy: admin._id
    },
    {
      engagementType: 'Senior / Specialist',
      billingUnit: 'Monthly',
      inr: { from: 200000, to: 320000 },
      usd: { from: 2500, to: 4000 },
      displayLabel: 'Principal Architect / Lead Level',
      indicative: true,
      active: true,
      updatedBy: admin._id
    },
    {
      engagementType: 'Dedicated Team',
      billingUnit: 'Monthly',
      inr: { from: 450000, to: 1200000 },
      usd: { from: 6000, to: 15000 },
      displayLabel: 'Offshore ODC Managed Pod (3-10 Devs)',
      indicative: true,
      active: true,
      updatedBy: admin._id
    }
  ];
  for (const p of pricingConfigs) {
    await PricingConfig.findOneAndUpdate({ engagementType: p.engagementType }, p, { upsert: true, new: true });
  }
  console.log('[Seeder] Pricing models seeded.');

  // 5. Talent Profiles
  const talentData = [
    {
      scrizianId: 'SCR-8841',
      displayName: 'Aarav M.',
      title: 'Lead Full-Stack Architect',
      summary: '9+ years architecting enterprise Next.js, Node.js and Python microservices on AWS with gRPC and Kafka.',
      role: 'Full Stack Developers',
      experienceYears: 9,
      skills: ['Next.js', 'Node.js', 'Python', 'AWS', 'MongoDB', 'Kafka', 'Docker'],
      categories: ['Full Stack Developers', 'Backend Developers'],
      availability: 'Immediate',
      hourlyRateUSD: 42,
      monthlyRateINR: 240000,
      relationshipBadge: 'Verified Scrizian',
      status: 'approved'
    },
    {
      scrizianId: 'SCR-1001',
      displayName: 'Sneha K.',
      title: 'Senior Frontend Architect',
      summary: '7+ years crafting ultra-responsive web applications, design systems, and Web Vitals optimization in Next.js.',
      role: 'Frontend Developers',
      experienceYears: 7,
      skills: ['React', 'Next.js', 'TypeScript', 'TailwindCSS', 'Redux', 'GraphQL'],
      categories: ['Frontend Developers'],
      availability: 'Immediate',
      hourlyRateUSD: 36,
      monthlyRateINR: 210000,
      relationshipBadge: 'Verified Scrizian',
      status: 'approved'
    },
    {
      scrizianId: 'SCR-2207',
      displayName: 'Rohan V.',
      title: 'Senior Frontend & E-Commerce Specialist',
      summary: '6+ years building headless storefronts with Next.js, Shopify, and sub-second page performance.',
      role: 'Frontend Developers',
      experienceYears: 6,
      skills: ['Next.js', 'Shopify Storefront API', 'TypeScript', 'TailwindCSS', 'Web Vitals'],
      categories: ['Frontend Developers'],
      availability: 'Immediate',
      hourlyRateUSD: 32,
      monthlyRateINR: 190000,
      relationshipBadge: 'Verified Scrizian',
      status: 'approved'
    },
    {
      scrizianId: 'SCR-3928',
      displayName: 'Ananya S.',
      title: 'Principal Product Designer (UI/UX)',
      summary: '8+ years creating multi-brand design systems, SaaS dashboards, and conversion-focused user experiences.',
      role: 'UI/UX Designers',
      experienceYears: 8,
      skills: ['Figma', 'Design Systems', 'User Research', 'Prototyping', 'Storybook', 'WCAG AAA'],
      categories: ['UI/UX Designers'],
      availability: 'Immediate',
      hourlyRateUSD: 38,
      monthlyRateINR: 220000,
      relationshipBadge: 'Verified Scrizian',
      status: 'approved'
    },
    {
      scrizianId: 'SCR-4416',
      displayName: 'Vikram B.',
      title: 'Senior Mobile Specialist (Flutter & Native)',
      summary: '7+ years engineering cross-platform iOS & Android mobile applications with BLE sensor sync and offline engines.',
      role: 'Mobile Developers',
      experienceYears: 7,
      skills: ['Flutter', 'iOS', 'Android', 'Firebase', 'BLE Sync', 'SQLite'],
      categories: ['Mobile Developers'],
      availability: '1-2 Weeks',
      hourlyRateUSD: 34,
      monthlyRateINR: 200000,
      relationshipBadge: 'Verified Scrizian',
      status: 'approved'
    },
    {
      scrizianId: 'SCR-6102',
      displayName: 'Gaurav P.',
      title: 'Senior Cloud & DevOps Architect',
      summary: '8+ years designing high-availability multi-region Kubernetes clusters, GitOps pipelines, and Terraform IaC.',
      role: 'DevOps & Cloud Engineers',
      experienceYears: 8,
      skills: ['Kubernetes', 'Terraform', 'AWS', 'GCP', 'ArgoCD', 'Prometheus', 'Docker'],
      categories: ['DevOps & Cloud Engineers'],
      availability: 'Immediate',
      hourlyRateUSD: 40,
      monthlyRateINR: 230000,
      relationshipBadge: 'Verified Scrizian',
      status: 'approved'
    },
    {
      scrizianId: 'SCR-9012',
      displayName: 'Siddharth M.',
      title: 'Lead Mobile Architect (Flutter & WebRTC)',
      summary: '6+ years delivering HIPAA-compliant healthcare applications and encrypted tele-consultation WebRTC mobile clients.',
      role: 'Mobile Developers',
      experienceYears: 6,
      skills: ['Flutter', 'iOS', 'Android', 'WebRTC', 'HIPAA Security'],
      categories: ['Mobile Developers'],
      availability: 'Immediate',
      hourlyRateUSD: 35,
      monthlyRateINR: 200000,
      relationshipBadge: 'Verified Scrizian',
      status: 'approved'
    },
    {
      scrizianId: 'SCR-5530',
      displayName: 'Kabir R.',
      title: 'Senior Backend Engineer (Node & Python)',
      summary: '7+ years building high-throughput payment gateways, banking microservices, and database tuning.',
      role: 'Backend Developers',
      experienceYears: 7,
      skills: ['Node.js', 'Python', 'FastAPI', 'PostgreSQL', 'Redis', 'RabbitMQ'],
      categories: ['Backend Developers'],
      availability: 'Immediate',
      hourlyRateUSD: 33,
      monthlyRateINR: 195000,
      relationshipBadge: 'Verified Scrizian',
      status: 'approved'
    }
  ];

  const talentMap = {};
  for (const t of talentData) {
    const doc = await TalentProfile.findOneAndUpdate(
      { scrizianId: t.scrizianId },
      { ...t, user: admin._id },
      { upsert: true, new: true, runValidators: true }
    );
    talentMap[t.scrizianId] = doc._id;
  }
  console.log(`[Seeder] Seeded ${Object.keys(talentMap).length} Verified Talent Profiles.`);

  // 6. Case Studies
  const caseStudiesData = [
    {
      slug: 'uk-health-tech-app-launched-in-14-weeks',
      title: 'UK Health-Tech App Launched in 14 Weeks',
      industry: 'Healthcare',
      region: 'United Kingdom',
      engagementModel: 'Dedicated Team Pod',
      challenge: 'A growing London healthcare startup needed a secure, HIPAA/GDPR compliant mobile application to connect NHS patient records with private tele-consultation specialists. In-house recruitment in the UK was quoted at 6+ months.',
      solution: 'Scriza assembled a 4-person dedicated Scrizian pod comprising a Flutter mobile architect (SCR-9012), a Laravel backend lead (SCR-5530), a DevOps engineer (SCR-6102), and a QA automation lead. The squad integrated OAuth2 NHS login, encrypted WebRTC video calls, and automated deployment pipelines.',
      results: 'Shipped MVP iOS and Android apps to store in 14 business weeks with 4.7/5 app store rating across 15,000 active monthly patients.',
      heroImage: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=70',
      technologyStack: ['Flutter', 'Laravel', 'WebRTC', 'AWS', 'Docker'],
      services: ['Mobile App Development', 'Tele-Health Architecture', 'DevOps CI/CD'],
      category: 'Healthcare',
      status: 'Published',
      publishedAt: new Date(),
      createdBy: admin._id
    },
    {
      slug: 'uae-retailer-cuts-qa-cycle-from-5-days-to-6-hours',
      title: 'UAE Retailer Cuts QA Cycle from 5 Days to 6 Hours',
      industry: 'Retail & E-commerce',
      region: 'UAE',
      engagementModel: 'Staff Augmentation',
      challenge: 'A prominent multi-brand retail enterprise in Dubai was plagued by manual regression QA cycles lasting 5 full days before every release, slowing product feature velocity.',
      solution: 'Scriza deployed QA automation engineers who engineered end-to-end parallel test suites with Playwright and GitHub Actions, covering web checkout, mobile app flows, and inventory APIs.',
      results: 'Cut regression turnaround from 5 days to 6 hours (95% reduction), achieved 82% automated test coverage, and decreased post-release bugs by 70%.',
      heroImage: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=70',
      technologyStack: ['Playwright', 'TypeScript', 'GitHub Actions', 'Docker'],
      services: ['QA Automation', 'CI/CD Pipeline', 'Test Governance'],
      category: 'E-commerce',
      status: 'Published',
      publishedAt: new Date(),
      createdBy: admin._id
    },
    {
      slug: 'ai-support-assistant-for-a-european-saas',
      title: 'AI Support Assistant for a European SaaS',
      industry: 'SaaS',
      region: 'Germany',
      engagementModel: 'Dedicated Pod',
      challenge: 'A SaaS platform with 50,000 global subscribers struggled with high tier-1 support ticket volumes and slow multilingual resolution times across European languages.',
      solution: 'AI specialists engineered a Retrieval-Augmented Generation (RAG) assistant connected to Pinecone vector DB and OpenAI GPT-4, integrated natively into their Zendesk and Slack workflows.',
      results: '40% automatic ticket deflection, 35% reduction in first response latency, supporting 6 European languages seamlessly.',
      heroImage: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=70',
      technologyStack: ['Python', 'FastAPI', 'LangChain', 'Pinecone', 'OpenAI'],
      services: ['AI & LLM Integration', 'Vector Database', 'Workflow Automation'],
      category: 'Artificial Intelligence',
      status: 'Published',
      publishedAt: new Date(),
      createdBy: admin._id
    },
    {
      slug: 'scaling-a-us-fintech-platform-with-a-dedicated-team',
      title: 'Scaling a US Fintech Platform with a Dedicated Team',
      industry: 'Fintech',
      region: 'United States',
      engagementModel: 'Dedicated ODC Pod',
      challenge: 'A US fintech lending engine needed to handle $50M+ monthly transaction throughput while complying with stringent SOC2 security controls and zero downtime mandates.',
      solution: 'A 9-member dedicated Scrizians engineering pod rebuilt legacy services into resilient Node.js microservices with Kafka event streaming and Kubernetes autoscaling on AWS.',
      results: 'Boosted deployment release cadence by 4x, decreased production incidents by 60%, and scaled loan approval volume by 400%.',
      heroImage: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=70',
      technologyStack: ['Node.js', 'Next.js', 'Kafka', 'AWS EKS', 'MongoDB'],
      services: ['Microservices Migration', 'Fintech Architecture', 'Cloud Governance'],
      category: 'Fintech',
      status: 'Published',
      publishedAt: new Date(),
      createdBy: admin._id
    }
  ];

  for (const cs of caseStudiesData) {
    await CaseStudy.findOneAndUpdate({ slug: cs.slug }, cs, { upsert: true, new: true, runValidators: true });
  }
  console.log(`[Seeder] Seeded ${caseStudiesData.length} Published Case Studies.`);

  // 7. Portfolio Projects
  const portfolioData = [
    {
      title: 'Lending Platform Re-architecture',
      slug: 'lending-platform-re-architecture',
      scrizianId: 'SCR-8841',
      industry: 'Fintech / Banking',
      projectType: 'Microservices & Cloud Architecture',
      summary: 'Complete microservices migration for a high-volume US lending platform processing $50M+ monthly volume.',
      role: 'Lead Full-Stack Architect',
      techStack: ['Next.js', 'Node.js', 'Python', 'Kafka', 'AWS', 'MongoDB'],
      media: [{ url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=70', type: 'image', approved: true }],
      duration: '6 Months',
      outcome: 'Reduced transaction latency by 64%, achieved 99.99% system uptime, and scaled loan approval throughput by 4x.',
      ndaProtected: true,
      status: 'Approved'
    },
    {
      title: 'D2C Storefront on Next.js',
      slug: 'd2c-storefront-on-nextjs',
      scrizianId: 'SCR-2207',
      industry: 'E-Commerce / D2C Retail',
      projectType: 'Headless Commerce Front-End',
      summary: 'Headless commerce storefront built for a fast-growing D2C brand with 98+ Google Lighthouse performance score.',
      role: 'Frontend Engineer',
      techStack: ['Next.js', 'Shopify Storefront API', 'TypeScript', 'TailwindCSS'],
      media: [{ url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=70', type: 'image', approved: true }],
      duration: '3 Months',
      outcome: 'Increased mobile checkout conversion rates by 38% and reduced page load times under 0.8 seconds.',
      ndaProtected: false,
      status: 'Approved'
    },
    {
      title: 'B2B Analytics Design System',
      slug: 'b2b-analytics-design-system',
      scrizianId: 'SCR-3928',
      industry: 'SaaS / Enterprise Software',
      projectType: 'Design Systems & UI Engineering',
      summary: 'A 120+ component design system adopted across 4 product teams for enterprise analytics dashboards.',
      role: 'Principal Product Designer',
      techStack: ['Figma', 'Design Systems', 'Storybook', 'User Research'],
      media: [{ url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=70', type: 'image', approved: true }],
      duration: '4 Months',
      outcome: 'Standardized design language across 4 SaaS products and cut frontend UI development time by 45%.',
      ndaProtected: false,
      status: 'Approved'
    },
    {
      title: 'Fitness Tracking Mobile App',
      slug: 'fitness-tracking-mobile-app',
      scrizianId: 'SCR-4416',
      industry: 'Health & Fitness Tech',
      projectType: 'Cross-Platform Mobile App',
      summary: 'Cross-platform iOS and Android mobile app with real-time BLE wearable sensor sync and offline workout caching.',
      role: 'Senior Mobile Specialist',
      techStack: ['Flutter', 'Firebase', 'BLE Sync', 'SQLite'],
      media: [{ url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=70', type: 'image', approved: true }],
      duration: '5 Months',
      outcome: 'Achieved 4.8-star App Store rating with over 100,000 active monthly subscribers.',
      ndaProtected: false,
      status: 'Approved'
    },
    {
      title: 'Zero-Downtime Kubernetes Platform',
      slug: 'zero-downtime-kubernetes-platform',
      scrizianId: 'SCR-6102',
      industry: 'Cloud Infrastructure / DevOps',
      projectType: 'Multi-Region Cloud Infrastructure',
      summary: 'Multi-region Google Kubernetes Engine (GKE) production infrastructure with GitOps deployment workflows.',
      role: 'Senior DevOps Specialist',
      techStack: ['GKE', 'ArgoCD', 'Terraform', 'Prometheus', 'Docker'],
      media: [{ url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=70', type: 'image', approved: true }],
      duration: '4 Months',
      outcome: 'Maintained 100% zero-downtime during peak Black Friday sales traffic spikes.',
      ndaProtected: false,
      status: 'Approved'
    },
    {
      title: 'Enterprise Document Q&A',
      slug: 'enterprise-document-qa',
      scrizianId: 'SCR-1001',
      industry: 'Artificial Intelligence / LLM',
      projectType: 'RAG Knowledge Search Engine',
      summary: 'Retrieval-Augmented Generation (RAG) assistant querying 2M+ internal enterprise documents with instant citations.',
      role: 'AI & Data Specialist',
      techStack: ['Python', 'LangChain', 'Pinecone', 'FastAPI', 'OpenAI'],
      media: [{ url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=70', type: 'image', approved: true }],
      duration: '3 Months',
      outcome: 'Reduced employee legal document research time from hours to under 5 seconds with 96% accuracy.',
      ndaProtected: true,
      status: 'Approved'
    }
  ];

  for (const p of portfolioData) {
    const talentId = talentMap[p.scrizianId] || talentMap['SCR-8841'];
    await Portfolio.findOneAndUpdate(
      { slug: p.slug },
      { ...p, talent: talentId },
      { upsert: true, new: true, runValidators: true }
    );
  }
  console.log(`[Seeder] Seeded ${portfolioData.length} Approved Portfolios.`);

  // 8. Articles / Insights
  const articlesData = [
    {
      slug: 'why-contract-to-hire-is-replacing-traditional-recruitment',
      title: 'Why Contract-to-Hire is Replacing Traditional Tech Recruitment in 2026',
      excerpt: 'How leading software companies reduce bad-hire risk by 80% using flexible 3-month contract-to-hire arrangements.',
      content: `### The High Cost of Hiring Mistakes
In modern software engineering, hiring the wrong senior engineer or architect costs more than just their salary. When you factor in lost momentum, recruiter commissions, onboard training, and eventual offboarding, a failed hire easily sets an engineering squad back by 6 to 9 months.

### The Contract-to-Hire Advantage
Contract-to-hire bridges this gap by allowing teams to work with vetted technical specialists on real codebase deliverables before making a long-term full-time commitment.

1. **Risk-Free Evaluation**: Test code quality, velocity, and culture alignment in real sprints.
2. **Immediate Onboarding**: Specialists onboard within 48 to 72 hours instead of 60-day notice periods.
3. **Seamless Transition**: Convert top performers to direct employees with zero friction.`,
      category: 'Hiring Guides',
      tags: ['Tech Hiring', 'Contract to Hire', 'Staffing', 'Engineering Leadership'],
      featuredImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=70',
      status: 'Published',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      author: author._id
    },
    {
      slug: 'how-to-evaluate-senior-react-developers-beyond-leetcode',
      title: 'How to Evaluate Senior React Developers Beyond LeetCode Puzzles',
      excerpt: 'Practical architectural interview questions that accurately assess state management, Web Vitals, and real-world system design.',
      content: `Algorithmic puzzles tell you if someone remembers computer science graphs, but they do not tell you if an engineer can architect a scalable Next.js application that handles 100,000 concurrent users with 99+ Lighthouse performance scores.

Here is the exact evaluation framework used by Scriza technical evaluators to assess senior React developers.`,
      category: 'Engineering',
      tags: ['React', 'Next.js', 'Frontend', 'Interviewing'],
      featuredImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=70',
      status: 'Published',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      author: author._id
    },
    {
      slug: 'the-true-cost-of-hiring-in-house-vs-offshore-engineering-teams',
      title: 'The True Cost of Hiring In-House vs Offshore Engineering Pods',
      excerpt: 'A comprehensive financial breakdown of taxes, equipment, benefits, and executive overhead comparing in-house vs dedicated ODC pods.',
      content: `When calculating developer expenses, leadership often compares raw hourly rates. But true total cost of employment (TCOE) includes healthcare, payroll taxes, office infrastructure, hardware leases, and severance contingencies.`,
      category: 'Hiring Guides',
      tags: ['Cost Analysis', 'Offshore Teams', 'Engineering Budget', 'ODC'],
      featuredImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=70',
      status: 'Published',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
      author: author._id
    },
    {
      slug: 'building-resilient-microservices-with-nodejs-and-kafka',
      title: 'Building Resilient Microservices with Node.js and Kafka Event Streams',
      excerpt: 'Architectural lessons learned from processing 50M+ transactions monthly with zero message loss and sub-50ms latency.',
      content: `Monolithic backends buckle when peak sales volume strikes. By implementing distributed Kafka partitions and idempotent Node.js consumers, engineering teams can scale transaction processing horizontally while maintaining strict ACID consistency where it matters.`,
      category: 'Architecture',
      tags: ['Node.js', 'Kafka', 'Microservices', 'Distributed Systems'],
      featuredImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=70',
      status: 'Published',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18),
      author: author._id
    },
    {
      slug: 'zero-downtime-kubernetes-deployments-with-argocd',
      title: 'Zero-Downtime Kubernetes Deployments with GitOps & ArgoCD',
      excerpt: 'How progressive canary rollouts and automated health checks eliminate deployment downtime for high-traffic SaaS applications.',
      content: `GitOps treats Git as the single source of truth for infrastructure and application states. With ArgoCD and automated Prometheus analysis, teams can ship releases to production 20 times a day with zero user interruption.`,
      category: 'DevOps',
      tags: ['Kubernetes', 'ArgoCD', 'GitOps', 'DevOps', 'CI/CD'],
      featuredImage: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=1200&q=70',
      status: 'Published',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25),
      author: author._id
    },
    {
      slug: 'enterprise-rag-best-practices-with-vector-databases',
      title: 'Enterprise RAG Best Practices: Scaling Vector Databases for Accurate AI Answers',
      excerpt: 'Techniques for hybrid dense-sparse vector search, metadata filtering, and chunking strategies to achieve 98% factual precision.',
      content: `Retrieval-Augmented Generation (RAG) is transforming enterprise internal search and customer support. However, simple chunking often yields hallucinated answers. Learn how hybrid BM25 + embedding ranking creates enterprise-grade precision.`,
      category: 'Artificial Intelligence',
      tags: ['AI', 'LLM', 'RAG', 'Vector Search', 'Pinecone'],
      featuredImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=70',
      status: 'Published',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      author: author._id
    }
  ];

  for (const art of articlesData) {
    await Article.findOneAndUpdate({ slug: art.slug }, art, { upsert: true, new: true, runValidators: true });
  }
  console.log(`[Seeder] Seeded ${articlesData.length} Published Articles.`);

  // 9. Jobs
  const jobsData = [
    {
      id: 'job-101',
      slug: 'senior-react-developer',
      title: 'Senior React Developer',
      department: 'ENGINEERING',
      location: 'Remote (India / Global)',
      type: 'Full-Time',
      experienceLevel: '4-7 years',
      salaryRangeUSD: '$21.5k – $33.5k',
      salaryRangeINR: '₹18,00,000 – ₹28,00,000 / year',
      description: 'We are seeking an experienced Senior React Developer to architect and deliver responsive, high-performance web applications for international client products.',
      requirements: [
        '4+ years of professional software development experience focused on React & TypeScript',
        'Solid expertise in Next.js App Router, SSR, SSG, and server components',
        'Experience working in remote, agile engineering teams with CI/CD deployment'
      ],
      status: 'Active'
    },
    {
      id: 'job-102',
      slug: 'nodejs-backend-engineer',
      title: 'Node.js Backend Engineer',
      department: 'ENGINEERING',
      location: 'Noida, India · Hybrid',
      type: 'Full-Time',
      experienceLevel: '3-6 years',
      salaryRangeUSD: '$18k – $28.7k',
      salaryRangeINR: '₹15,00,000 – ₹24,00,000 / year',
      description: 'Join our core engineering team in Noida to build resilient, high-throughput microservices APIs using Node.js and MongoDB.',
      requirements: [
        '3+ years experience with Node.js, Express, and MongoDB in production environments',
        'Strong understanding of asynchronous processing, Redis caching, and microservices',
        'Degree in Computer Science or equivalent practical experience'
      ],
      status: 'Active'
    },
    {
      id: 'job-103',
      slug: 'devops-engineer-contract',
      title: 'DevOps Engineer (Contract)',
      department: 'CLOUD',
      location: 'Remote · Global',
      type: 'Contract',
      experienceLevel: '5+ years',
      salaryRangeUSD: '$3k – $4.2k / month',
      salaryRangeINR: '₹2,50,000 – ₹3,50,000 / month',
      description: 'Contract engagement for a Senior DevOps Engineer to automate multi-region Kubernetes deployments and Terraform IaC pipelines.',
      requirements: [
        '5+ years hands-on DevOps and Cloud Infrastructure experience',
        'Certified Kubernetes Administrator (CKA) or AWS DevOps Pro certified preferred'
      ],
      status: 'Active'
    },
    {
      id: 'job-104',
      slug: 'qa-automation-intern',
      title: 'QA Automation Intern',
      department: 'QUALITY',
      location: 'Noida, India · On Site',
      type: 'Full-Time',
      experienceLevel: '0-1 years',
      salaryRangeUSD: '$180 – $300 / month',
      salaryRangeINR: '₹15,000 – ₹25,000 / month',
      description: 'Great opportunity for entry-level engineering graduates to build automated testing suites using Playwright and Selenium.',
      requirements: [
        'Strong basic knowledge of JavaScript/TypeScript or Python programming',
        'Passionate about software quality and test-driven development'
      ],
      status: 'Active'
    },
    {
      id: 'job-105',
      slug: 'ui-ux-designer',
      title: 'UI/UX Designer',
      department: 'DESIGN',
      location: 'Remote (India) · Remote',
      type: 'Full-Time',
      experienceLevel: '3-5 years',
      salaryRangeUSD: '$14.4k – $21.5k',
      salaryRangeINR: '₹12,00,000 – ₹18,00,000 / year',
      description: 'Product designer needed to craft conversion-focused user journeys, SaaS dashboards, and design systems in Figma.',
      requirements: [
        '3+ years product design experience with a strong portfolio showing web/mobile SaaS work'
      ],
      status: 'Active'
    },
    {
      id: 'job-106',
      slug: 'flutter-developer-part-time',
      title: 'Flutter Developer (Part-time)',
      department: 'MOBILE',
      location: 'Remote · Remote',
      type: 'Part-Time',
      experienceLevel: '2-4 years',
      salaryRangeUSD: '$720 – $1.1k / month',
      salaryRangeINR: '₹60,000 – ₹90,000 / month',
      description: 'Part-time opportunity for Flutter developers to maintain and ship feature updates to cross-platform mobile apps.',
      requirements: [
        '2+ years Flutter experience with published apps on Google Play or App Store'
      ],
      status: 'Active'
    }
  ];

  for (const j of jobsData) {
    await Job.findOneAndUpdate({ $or: [{ id: j.id }, { slug: j.slug }] }, j, { upsert: true, new: true, runValidators: true });
  }
  console.log(`[Seeder] Seeded ${jobsData.length} Active Jobs.`);

  console.log('\n========================================');
  console.log('✅ ALL SEED DATA SUCCESSFULLY POPULATED!');
  console.log('========================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seeder] Fatal error during seeding:', err);
  process.exit(1);
});
