'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { LeadModal } from '@/components/LeadModal/LeadModal';
import styles from './WriteForScrizians.module.css';

export default function WriteForScriziansPage() {
  const [fullName, setFullName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [pitch, setPitch] = useState('');
  const [agree, setAgree] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  const handleSubmitPitch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <Header onOpenLeadModal={() => setIsLeadModalOpen(true)} />

      {/* Hero Section matching media_1790940521487.png */}
      <section className={styles.hero}>
        <div className={styles.heroRingWrapper}>
          <div className={styles.heroRing} />
        </div>

        <div className={styles.heroInner}>
          <div className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>Home</Link> / Community
          </div>

          <span className={styles.eyebrow}>COMMUNITY</span>
          <h1 className={styles.title}>Write for Scrizians</h1>
          <p className={styles.subtitle}>
            Join developers, designers and engineers sharing practical knowledge with the global tech community.
          </p>

          <Link href="/register?role=contributor" className={styles.btnCreate}>
            Create contributor account
          </Link>
        </div>
      </section>

      {/* Main Container */}
      <main className={styles.mainContainer}>
        {/* 4 Feature Cards Row matching media_1790940521487.png */}
        <div className={styles.featuresGrid4}>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>✏️</span>
            <h3 className={styles.featureTitle}>Publish expert content</h3>
            <p className={styles.featureDesc}>
              Share hiring guides, technical deep-dives and career advice with a global audience.
            </p>
          </div>

          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>🎖️</span>
            <h3 className={styles.featureTitle}>Earn the Community badge</h3>
            <p className={styles.featureDesc}>
              Approved contributors receive the Community Member badge on their Scrizian profile.
            </p>
          </div>

          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>🛡️</span>
            <h3 className={styles.featureTitle}>Editorial review</h3>
            <p className={styles.featureDesc}>
              Every article is reviewed for quality, originality and safety before publishing.
            </p>
          </div>

          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>👥</span>
            <h3 className={styles.featureTitle}>Grow your network</h3>
            <p className={styles.featureDesc}>
              Get discovered by international clients through your published work.
            </p>
          </div>
        </div>

        {/* 2-Column Section: Editorial Guidelines & Pitch Form matching media_1790940521487.png */}
        <div className={styles.twoColSection}>
          {/* Left Column: Guidelines */}
          <div className={styles.guidelinesCard}>
            <h2 className={styles.guidelinesTitle}>Editorial guidelines</h2>

            <div className={styles.guidelinesList}>
              <div className={styles.guidelineItem}>
                <span className={styles.checkRed}>✓</span>
                <div>Original, practical and expert content (800+ words recommended)</div>
              </div>

              <div className={styles.guidelineItem}>
                <span className={styles.checkRed}>✓</span>
                <div>No promotional links, phone numbers or contact details in articles</div>
              </div>

              <div className={styles.guidelineItem}>
                <span className={styles.checkRed}>✓</span>
                <div>Code samples must not contain secrets or confidential client code</div>
              </div>

              <div className={styles.guidelineItem}>
                <span className={styles.checkRed}>✓</span>
                <div>Articles go through Draft → Submitted → Review → Published</div>
              </div>
            </div>
          </div>

          {/* Right Column: Pitch Form */}
          <div className={styles.pitchCard}>
            <h2 className={styles.pitchTitle}>Pitch an article</h2>

            {submitted ? (
              <div style={{ background: '#DCFCE7', color: '#15803D', padding: '1.5rem', borderRadius: '8px', fontWeight: 700, lineHeight: 1.5 }}>
                🎉 Thank you! Your article pitch has been submitted. Our editorial team will review your pitch and get back to you at {workEmail} within 2 business days.
              </div>
            ) : (
              <form onSubmit={handleSubmitPitch}>
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                    <label className={styles.label}>Full name *</label>
                    <input 
                      type="text" 
                      required 
                      className={styles.input} 
                      placeholder="e.g. Aarav Sharma"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                    <label className={styles.label}>Work email *</label>
                    <input 
                      type="email" 
                      required 
                      className={styles.input} 
                      placeholder="aarav@company.com"
                      value={workEmail}
                      onChange={e => setWorkEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Your article pitch *</label>
                  <textarea 
                    required 
                    className={styles.textarea} 
                    placeholder="Briefly describe your article topic, key technical takeaways, and target audience..."
                    value={pitch}
                    onChange={e => setPitch(e.target.value)}
                  />
                </div>

                <div className={styles.checkboxRow}>
                  <input 
                    type="checkbox" 
                    required 
                    id="agreeCheck"
                    className={styles.checkbox}
                    checked={agree}
                    onChange={e => setAgree(e.target.checked)}
                  />
                  <label htmlFor="agreeCheck" style={{ cursor: 'pointer' }}>
                    I agree to the Privacy Policy and consent to Scrizians contacting me about this enquiry.
                  </label>
                </div>

                <button type="submit" className={styles.btnSubmit}>
                  Submit enquiry
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
