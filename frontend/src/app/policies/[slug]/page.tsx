'use client';

import React from 'react';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import styles from './Policies.module.css';

export default function PolicySlugPage({ params }: { params: { slug: string } }) {
  const getPolicyContent = (slug: string) => {
    switch (slug) {
      case 'privacy':
        return {
          title: '19.1 Privacy Policy',
          updated: 'October 2, 2026',
          body: (
            <>
              <h2>1. Platform Identity & Backing</h2>
              <p>Scrizians is a public-facing global technology talent, careers, and knowledge platform backed by <strong>Scriza Private Limited</strong>. Official contact desk: <strong>+91 91191 12999</strong>.</p>
              <h2>2. Information We Collect</h2>
              <p>We collect account details, professional profiles, resumes, portfolio submissions, client requirement forms, verification documents, and audit logs.</p>
              <h2>3. Public vs Private Distinction (Anti-Bypass Protection)</h2>
              <p>Only approved professional information (Scrizian ID, title, skills, experience, anonymized portfolio) is publicly indexable. Personal phone, email, WhatsApp, LinkedIn URL, GitHub profile URL, personal website, and exact address remain strictly private to protect talent privacy.</p>
              <h2>4. International Data Transfers & Retention</h2>
              <p>Data is stored securely in compliant enterprise cloud infrastructure. Retention follows statutory operational requirements and user rights workflows.</p>
            </>
          )
        };
      case 'terms':
        return {
          title: '19.2 Terms of Use',
          updated: 'October 2, 2026',
          body: (
            <>
              <h2>1. Platform Scope & Discovery</h2>
              <p>Scrizians provides professional discovery, hiring, career management, and technical knowledge content. Scrizian IDs represent platform identity and do not establish employment by Scriza Private Limited.</p>
              <h2>2. Acceptable Platform Conduct</h2>
              <p>No impersonation, fake experience, unlawful scraping, bypassing contact controls, credential sharing, or security abuse is tolerated. Violations result in immediate suspension.</p>
              <h2>3. Intellectual Property License</h2>
              <p>Contributors grant Scrizians a non-exclusive license to publish submitted portfolio and article content while maintaining original ownership.</p>
            </>
          )
        };
      case 'talent-terms':
        return {
          title: '19.3 Talent / Freelancer Terms',
          updated: 'October 2, 2026',
          body: (
            <>
              <h2>1. Profile Accuracy & Non-Bypass</h2>
              <p>Talent members guarantee that all listed experience, skills, and portfolio work are accurate. Direct personal contact details must never be posted in public fields.</p>
              <h2>2. Portfolio & Client Confidentiality</h2>
              <p>All client work under NDA must be anonymized before display. You warrant that you hold all rights to display uploaded screenshots and code samples.</p>
              <h2>3. Verification Badges</h2>
              <p>Verification indicates completed skill and background checks by Scrizians. It is not an absolute guarantee of future performance.</p>
            </>
          )
        };
      case 'client-terms':
        return {
          title: '19.4 Client / Company Terms',
          updated: 'October 2, 2026',
          body: (
            <>
              <h2>1. Truthful Requirement Submissions</h2>
              <p>Clients agree to submit accurate project requirements, tech stack specs, and engagement parameters.</p>
              <h2>2. Evaluation & Contract Execution</h2>
              <p>Scrizian talent profiles are provided for evaluation through the Scrizians managed workflow. Commercial scope, replacements, IP, and payment terms are governed by signed MSA/SOW agreements.</p>
              <h2>3. Data Harvesting Prohibition</h2>
              <p>Clients are strictly prohibited from harvesting, scraping, or redistributing Scrizian talent profiles.</p>
            </>
          )
        };
      case 'contributor-policy':
        return {
          title: '19.5 Contributor / Editorial Policy',
          updated: 'October 2, 2026',
          body: (
            <>
              <h2>1. Original Content Standards</h2>
              <p>All technical articles and hiring guides must be original, experience-based, and useful. Plagiarism and affiliate spam are strictly prohibited.</p>
              <h2>2. Editorial & Technical Review Workflow</h2>
              <p>Articles undergo a multi-step review: Draft → Submit → Editorial Review → Technical Review → SEO Review → Approved / Scheduled / Published.</p>
              <h2>3. Citations & Attribution</h2>
              <p>Factual claims require proper citations. Every article displays verified Scrizian or author attribution.</p>
            </>
          )
        };
      case 'portfolio-policy':
        return {
          title: '19.6 Portfolio & Intellectual Property Policy',
          updated: 'October 2, 2026',
          body: (
            <>
              <h2>1. Ownership & Rights Confirmation</h2>
              <p>Uploaders must confirm rights to display all submitted text, images, and code snippets.</p>
              <h2>2. NDA Protection & Anonymization</h2>
              <p>Confidential client work must use the NDA Protected option with anonymized project titles and logos.</p>
              <h2>3. Takedown & Moderation</h2>
              <p>Copyright infringement reports are acted upon within 24 business hours by Scriza moderation.</p>
            </>
          )
        };
      case 'cookie-policy':
        return {
          title: '19.7 Cookie Policy',
          updated: 'October 2, 2026',
          body: (
            <>
              <h2>1. Essential Security Cookies</h2>
              <p>We use HTTP-only cookies for authentication tokens, session integrity, CSRF prevention, and display currency preferences (USD/INR).</p>
              <h2>2. Preference Management</h2>
              <p>Users may customize analytics and performance cookies via browser settings or in-app preferences.</p>
            </>
          )
        };
      case 'acceptable-use':
        return {
          title: '19.8 Acceptable Use & Community Guidelines',
          updated: 'October 2, 2026',
          body: (
            <>
              <h2>1. Prohibited Material</h2>
              <p>No malware, unauthorized scraping tools, spam, offensive content, or contact bypass attempts in restricted areas.</p>
              <h2>2. Fraud & Impersonation Zero Tolerance</h2>
              <p>Creating fake jobs, fake talent profiles, or fabricated credentials results in permanent platform ban and legal notice.</p>
            </>
          )
        };
      case 'refund-policy':
        return {
          title: '19.9 Refund & Cancellation Policy',
          updated: 'October 2, 2026',
          body: (
            <>
              <h2>1. Engagement Refund Rules</h2>
              <p>Refund and replacement terms depend on specific signed commercial SOW agreements with Scriza Private Limited.</p>
              <h2>2. Talent Replacement Guarantee</h2>
              <p>If a placed Scrizian resource does not meet performance benchmarks during trial, Scrizians provides curated replacement within 5 business days.</p>
            </>
          )
        };
      case 'disclaimer':
        return {
          title: '19.10 Disclaimer',
          updated: 'October 2, 2026',
          body: (
            <>
              <h2>1. Information & Advice Disclaimer</h2>
              <p>Articles and public guides are for general informational purposes and do not constitute legal, tax, or official financial advice.</p>
              <h2>2. Trademarks & Third-Party Branding</h2>
              <p>All third-party tech names (React, Node.js, AWS, Figma, etc.) belong to their respective trademark holders.</p>
            </>
          )
        };
      case 'grievance':
        return {
          title: '19.11 Grievance / Contact Policy',
          updated: 'October 2, 2026',
          body: (
            <>
              <h2>Grievance Redressal Mechanism</h2>
              <p>Per legal requirements, any concerns regarding privacy, IP infringement, or platform issues should be addressed to:</p>
              <p><strong>Grievance Officer:</strong> Scriza Legal & Compliance Team<br/>
              <strong>Parent Company:</strong> Scriza Private Limited<br/>
              <strong>Office Contact Phone:</strong> +91 91191 12999<br/>
              <strong>Official Email:</strong> legal@scriza.in</p>
            </>
          )
        };
      default:
        return {
          title: `${slug.replace('-', ' ').toUpperCase()} Policy`,
          updated: 'October 2, 2026',
          body: (
            <p>This policy outlines the commercial and operational terms governed by <strong>Scriza Private Limited</strong> for all platform activities on Scrizians.com.</p>
          )
        };
    }
  };

  const policy = getPolicyContent(params.slug);

  return (
    <>
      <Header />

      <div className={styles.container}>
        <div className={styles.box}>
          <h1 className={styles.title}>{policy.title}</h1>
          <div className={styles.subtitle}>Effective Date / Last Updated: {policy.updated} | Scriza Private Limited</div>

          <div className={styles.content}>
            {policy.body}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
