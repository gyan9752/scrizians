const mockTalent = [
  {
    scrizianId: 'SCR-8841',
    displayName: 'Aarav M.',
    title: 'Lead Full-Stack Architect',
    category: 'Full Stack Developers',
    summary: '9+ years architecting enterprise Next.js, Node.js and Python microservices on AWS.',
    experienceYears: 9,
    skills: ['Next.js', 'Node.js', 'Python', 'AWS', 'MongoDB', 'TypeScript'],
    timezone: 'IST (UTC+5:30)',
    availability: 'Available now',
    hourlyRateUSD: 42,
    monthlyRateINR: 240000,
    relationshipBadge: 'Scriza Team Member',
    status: 'approved',
    avatarText: '41'
  },
  {
    scrizianId: 'SCR-6648',
    displayName: 'Priya K.',
    title: 'Java & Spring Boot Engineer',
    category: 'Backend Developers',
    summary: '8+ years building high-throughput banking APIs, microservices and Kafka event streams.',
    experienceYears: 8,
    skills: ['Java', 'Spring Boot', 'Microservices', 'Kafka', 'PostgreSQL'],
    timezone: 'IST (UTC+5:30)',
    availability: 'Available now',
    hourlyRateUSD: 36,
    monthlyRateINR: 200000,
    relationshipBadge: 'Verified Scrizian',
    status: 'approved',
    avatarText: '48'
  },
  {
    scrizianId: 'SCR-3928',
    displayName: 'Ananya S.',
    title: 'Principal UI/UX Product Designer',
    category: 'UI/UX Designers',
    summary: '8+ years creating design systems, complex SaaS dashboards and B2B user journeys in Figma.',
    experienceYears: 8,
    skills: ['Figma', 'Design Systems', 'Prototyping', 'User Research', 'CSS Modules'],
    timezone: 'IST (UTC+5:30)',
    availability: 'Partially available',
    hourlyRateUSD: 35,
    monthlyRateINR: 190000,
    relationshipBadge: 'Verified Scrizian',
    status: 'approved',
    avatarText: '28'
  },
  {
    scrizianId: 'SCR-6102',
    displayName: 'Rohan V.',
    title: 'Senior Cloud & DevOps Engineer',
    category: 'DevOps Engineers',
    summary: '7+ years deploying multi-region Kubernetes clusters, Terraform IaC, and GCP/AWS pipelines.',
    experienceYears: 7,
    skills: ['Kubernetes', 'Terraform', 'GCP', 'AWS', 'CI/CD', 'Docker'],
    timezone: 'IST (UTC+5:30)',
    availability: 'Available now',
    hourlyRateUSD: 38,
    monthlyRateINR: 210000,
    relationshipBadge: 'Verified Scrizian',
    status: 'approved',
    avatarText: '02'
  },
  {
    scrizianId: 'SCR-4491',
    displayName: 'Vikram R.',
    title: 'Senior React & Frontend Engineer',
    category: 'Frontend Developers',
    summary: '6+ years building pixel-perfect Next.js web apps with strict performance and accessibility standards.',
    experienceYears: 6,
    skills: ['React', 'Next.js', 'TypeScript', 'Tailwind', 'Redux', 'Jest'],
    timezone: 'IST (UTC+5:30)',
    availability: 'Available now',
    hourlyRateUSD: 30,
    monthlyRateINR: 160000,
    relationshipBadge: 'Verified Scrizian',
    status: 'approved',
    avatarText: '91'
  },
  {
    scrizianId: 'SCR-5520',
    displayName: 'Neha G.',
    title: 'Lead QA Automation Engineer',
    category: 'QA Engineers',
    summary: '7+ years engineering Playwright and Cypress automation suites for web & mobile apps.',
    experienceYears: 7,
    skills: ['Playwright', 'Cypress', 'Selenium', 'API Testing', 'Jenkins'],
    timezone: 'IST (UTC+5:30)',
    availability: 'Available now',
    hourlyRateUSD: 28,
    monthlyRateINR: 150000,
    relationshipBadge: 'Verified Scrizian',
    status: 'approved',
    avatarText: '20'
  }
];

const mockJobs = [
  {
    id: 'job-1',
    title: 'Senior Next.js & Full-Stack Developer',
    slug: 'senior-nextjs-fullstack-developer',
    department: 'Engineering',
    location: 'Remote (India / Global)',
    type: 'Full-Time',
    experienceLevel: '5+ Years',
    salaryRangeINR: '₹14,00,000 - ₹24,00,000 / year',
    salaryRangeUSD: '$25,000 - $40,000 / year',
    description: 'We are seeking an experienced Next.js Developer to build responsive, high-performance web applications and dashboards with clean component architecture and Node.js APIs.',
    requirements: [
      '5+ years experience with React & Next.js App Router',
      'Strong Node.js & MongoDB database design skills',
      'Experience with CSS Modules and clean frontend/backend separation'
    ],
    responsibilities: [
      'Develop SSR/SSG pages with lighthouse optimization',
      'Collaborate with Scriza client delivery teams',
      'Maintain clean code quality and unit testing'
    ]
  },
  {
    id: 'job-2',
    title: 'DevOps & Cloud Security Specialist',
    slug: 'devops-cloud-security-specialist',
    department: 'Infrastructure',
    location: 'Remote (India)',
    type: 'Contract',
    experienceLevel: '6+ Years',
    salaryRangeINR: '₹18,00,000 - ₹28,00,000 / year',
    salaryRangeUSD: '$30,000 - $48,00,000 / year',
    description: 'Join our Cloud & Infrastructure squad to manage multi-tenant Kubernetes environments and AWS infrastructure.',
    requirements: [
      'Deep expertise in AWS, Terraform, Docker, and Kubernetes',
      'Experience with monitoring tools (Prometheus, Grafana)',
      'Strong security-first mindset'
    ],
    responsibilities: [
      'Set up automated CI/CD pipelines',
      'Ensure 99.99% uptime and zero-trust security controls'
    ]
  },
  {
    id: 'job-3',
    title: 'Lead QA Automation Engineer (Playwright)',
    slug: 'lead-qa-automation-engineer-playwright',
    department: 'Quality Assurance',
    location: 'Remote (Global)',
    type: 'Full-Time',
    experienceLevel: '6+ Years',
    salaryRangeINR: '₹15,00,000 - ₹22,00,000 / year',
    salaryRangeUSD: '$26,000 - $38,000 / year',
    description: 'Lead automated regression testing suites for e-commerce and fintech platforms.',
    requirements: [
      'Proven expertise in Playwright & Cypress',
      'REST API automation and CI pipeline integration',
      'Strong JavaScript/TypeScript skills'
    ],
    responsibilities: [
      'Build scalable E2E testing framework from scratch',
      'Mentor junior QA engineers and report release metrics'
    ]
  }
];

const mockCaseStudies = [
  {
    title: 'UK Health-Tech App Launched in 14 Weeks',
    slug: 'uk-health-tech-app-launched-in-14-weeks',
    clientIndustry: 'Healthcare · United Kingdom',
    summary: 'Flutter + Laravel Scrizians delivered a HIPAA-aware patient app from scratch.',
    metrics: [
      { label: 'Launch', value: '14 wks' },
      { label: 'Store rating', value: '4.7 ★' },
      { label: 'Crash-free', value: '99.6%' }
    ],
    challenge: 'Client required a HIPAA-compliant patient consultation and prescription delivery mobile app with tight 16-week investor deadline.',
    solution: 'Scrizians deployed a cross-functional pod of 4 engineers (Flutter, Laravel API, QA) with continuous integration and automated compliance audits.',
    techStack: ['Flutter', 'Laravel', 'MySQL', 'AWS', 'Playwright']
  },
  {
    title: 'UAE Retailer Cuts QA Cycle from 5 Days to 6 Hours',
    slug: 'uae-retailer-cuts-qa-cycle-from-5-days-to-6-hours',
    clientIndustry: 'Retail & E-commerce · UAE',
    summary: 'QA automation Scrizians built a Playwright regression suite across web and mobile.',
    metrics: [
      { label: 'Regression time', value: '-95%' },
      { label: 'Test coverage', value: '82%' },
      { label: 'Escaped bugs', value: '-70%' }
    ],
    challenge: 'Manual regression testing took 5 full business days before every bi-weekly production release, causing release delays and bug leaks.',
    solution: 'Scrizians QA automation engineers implemented a Playwright test framework executing 450+ automated test scenarios in parallel CI runs.',
    techStack: ['Playwright', 'TypeScript', 'Docker', 'GitHub Actions']
  }
];

const mockArticles = [
  {
    title: 'How to Hire React Developers from India in 2026',
    slug: 'how-to-hire-react-developers-from-india-in-2026',
    category: 'Hiring Guides',
    summary: 'A step-by-step framework to evaluate, interview and onboard React developers for remote teams.',
    author: 'SCR-8841',
    date: '02 Oct 2026',
    readTime: '6 min read',
    content: 'Building a high-impact engineering team requires assessing technical depth, asynchronous communication, and architectural discipline. In this guide, we break down proven evaluation criteria...'
  },
  {
    title: 'Staff Augmentation vs Dedicated Team: Which Model Fits You?',
    slug: 'staff-augmentation-vs-dedicated-team-which-model-fits-you',
    category: 'Engagement Models',
    summary: 'Compare cost, control and speed across the most common offshore engagement models.',
    author: 'Scrizians Editorial',
    date: '27 Sept 2026',
    readTime: '6 min read',
    content: 'When expanding your software development capacity, selecting the right engagement model determines cost efficiency, project control, and delivery speed...'
  },
  {
    title: 'Kubernetes Interview Questions for Senior DevOps Roles',
    slug: 'kubernetes-interview-questions-for-senior-devops-roles',
    category: 'Interview Resources',
    summary: 'Practical, scenario-based questions that separate real operators from resume keywords.',
    author: 'SCR-8841',
    date: '22 Sept 2026',
    readTime: '6 min read',
    content: 'Evaluating DevOps candidates requires going beyond syntax memory into scenario troubleshooting, cluster security, ingress controller setup, and pod autoscaling...'
  }
];

module.exports = { mockTalent, mockJobs, mockCaseStudies, mockArticles, mockLeads: [] };
