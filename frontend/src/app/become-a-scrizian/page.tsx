'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { addInboundLead } from '@/utils/dataSync';
import { PhoneInputField } from '@/components/PhoneInputField/PhoneInputField';
import styles from './Onboarding.module.css';

export default function BecomeAScrizianPage() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    title: '',
    experienceYears: '5',
    skills: 'React, Next.js, Node.js',
    expectedRateUSD: '30'
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      const result: any = await addInboundLead({
        name: formData.name || 'Anonymous Talent Applicant',
        email: formData.email,
        phone: phone.trim(),
        company: 'Talent Network Applicant',
        serviceRequested: `Become a Scrizian (${formData.title || 'Tech Specialist'})`,
        message: `Talent Application Details: Title: ${formData.title}, Experience: ${formData.experienceYears} yrs, Skills: ${formData.skills}, Expected Rate: $${formData.expectedRateUSD}/hr`
      });
      if (!result?.success) {
        showToast(result?.error || result?.message || 'Could not submit your application. Please try again.');
        return;
      }
      showToast('Application submitted! Our team will contact you soon.');
      setStep(1);
      setPhone('');
      setFormData({
        name: '',
        email: '',
        title: '',
        experienceYears: '5',
        skills: 'React, Next.js, Node.js',
        expectedRateUSD: '30'
      });
    }
  };

  return (
    <>
      <Header />

      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: '#0B172A',
          color: '#ffffff',
          padding: '0.9rem 1.4rem',
          borderRadius: '10px',
          zIndex: 99999,
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

      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Become a Scrizian</h1>
          <p className={styles.subtitle}>
            Join India’s top curated tech talent network. Protect your privacy with a Scrizian ID while connecting with top-tier companies.
          </p>

          <div className={styles.stepBar}>
            <span className={step >= 1 ? styles.stepActive : ''}>1. Basic Identity</span>
            <span className={step >= 2 ? styles.stepActive : ''}>2. Skills & Experience</span>
            <span className={step >= 3 ? styles.stepActive : ''}>3. Verification & Submit</span>
          </div>

          <form onSubmit={handleNext} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {step === 1 && (
                <>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Full Legal Name *</label>
                    <input required type="text" style={{ width: '100%', padding: '0.55rem 0', border: 'none', borderBottom: '2px solid #E2E8F0', borderRadius: 0, fontSize: '0.92rem', fontWeight: 600, color: '#0F172A', outline: 'none', background: 'transparent' }} placeholder="Aarav Sharma" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>🔒 Kept private; not shown on public profile.</span>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Personal Email *</label>
                    <input required type="email" style={{ width: '100%', padding: '0.55rem 0', border: 'none', borderBottom: '2px solid #E2E8F0', borderRadius: 0, fontSize: '0.92rem', fontWeight: 600, color: '#0F172A', outline: 'none', background: 'transparent' }} placeholder="aarav@gmail.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Phone / WhatsApp *</label>
                    <PhoneInputField
                      value={phone}
                      onChange={(val) => setPhone(val)}
                      placeholder="98765 43210"
                      variant="underline"
                      required
                    />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Professional Title *</label>
                    <input required type="text" style={{ width: '100%', padding: '0.55rem 0', border: 'none', borderBottom: '2px solid #E2E8F0', borderRadius: 0, fontSize: '0.92rem', fontWeight: 600, color: '#0F172A', outline: 'none', background: 'transparent' }} placeholder="e.g. Senior Next.js & Full-Stack Architect" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Years of Professional Experience *</label>
                    <input required type="number" style={{ width: '100%', padding: '0.55rem 0', border: 'none', borderBottom: '2px solid #E2E8F0', borderRadius: 0, fontSize: '0.92rem', fontWeight: 600, color: '#0F172A', outline: 'none', background: 'transparent' }} value={formData.experienceYears} onChange={e => setFormData({ ...formData, experienceYears: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Primary Skills (Comma Separated) *</label>
                    <input required type="text" style={{ width: '100%', padding: '0.55rem 0', border: 'none', borderBottom: '2px solid #E2E8F0', borderRadius: 0, fontSize: '0.92rem', fontWeight: 600, color: '#0F172A', outline: 'none', background: 'transparent' }} value={formData.skills} onChange={e => setFormData({ ...formData, skills: e.target.value })} />
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Expected Hourly Rate ($ USD / hr)</label>
                    <input required type="number" style={{ width: '100%', padding: '0.55rem 0', border: 'none', borderBottom: '2px solid #E2E8F0', borderRadius: 0, fontSize: '0.92rem', fontWeight: 600, color: '#0F172A', outline: 'none', background: 'transparent' }} value={formData.expectedRateUSD} onChange={e => setFormData({ ...formData, expectedRateUSD: e.target.value })} />
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '6px', fontSize: '0.85rem', color: '#475569' }}>
                    By clicking submit, you confirm that your submitted profile and portfolio declarations are truthful and consent to Scrizians Privacy Policy & Talent Terms.
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                {step > 1 && (
                  <button type="button" onClick={() => setStep(step - 1)} style={{ background: '#F1F5F9', border: 'none', padding: '0.7rem 1.2rem', borderRadius: '6px', fontWeight: 600 }}>
                    Back
                  </button>
                )}
                <button type="submit" style={{ background: 'var(--color-red)', color: '#ffffff', border: 'none', padding: '0.7rem 1.8rem', borderRadius: '6px', fontWeight: 700, marginLeft: 'auto' }}>
                  {step === 3 ? 'Submit Application' : 'Next Step →'}
                </button>
              </div>
            </form>
        </div>
      </div>

      <Footer />
    </>
  );
}
