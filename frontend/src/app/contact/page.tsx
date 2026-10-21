'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { LeadModal } from '@/components/LeadModal/LeadModal';
import { addInboundLead } from '@/utils/dataSync';
import { PhoneInputField } from '@/components/PhoneInputField/PhoneInputField';
import styles from './Contact.module.css';

export default function ContactPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result: any = await addInboundLead({
        name: `${firstName} ${lastName}`.trim(),
        email,
        phone: phone.trim(),
        company: 'Contact Form Inquiry',
        serviceRequested: 'General Contact Inquiry',
        message
      });

      if (result?.success) {
        showToast('Message sent successfully! Scrizians team will respond within 24 hrs.');
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
        setMessage('');
      } else {
        showToast(result?.error || result?.message || 'Could not send your message. Please try again.');
      }
    } catch (err) {
      showToast('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header onOpenLeadModal={() => setIsLeadModalOpen(true)} />

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

      <main className={styles.contactSection}>
        {/* Centered Top Heading Area */}
        <div className={styles.headerContainer}>
          <h1 className={styles.mainTitle}>Contact Us</h1>
          <p className={styles.subTitle}>Any questions or remarks? Just write us a message!</p>
        </div>

        {/* Main Card Wrapper */}
        <div className={styles.contactCardWrapper}>
          {/* Left Dark Navy Card */}
          <div className={styles.darkInfoCard}>
            <div className={styles.circleGlow1} />
            <div className={styles.circleGlow2} />

            <div>
              <h2 className={styles.cardHeading}>Contact Information</h2>
              <p className={styles.cardSub}>Say something to start a live chat!</p>

              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <svg className={styles.infoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <a href="tel:+919119112999" className={styles.infoText}>+91 91191 12999</a>
                </div>

                <div className={styles.infoItem}>
                  <svg className={styles.infoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <a href="mailto:info@scriza.in" className={styles.infoText}>info@scriza.in</a>
                </div>

                <div className={styles.infoItem}>
                  <svg className={styles.infoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span className={styles.infoText}>
                    NX-ONE, Tech Zone IV, Plot No 17, Greater Noida, Uttar Pradesh 201318
                  </span>
                </div>
              </div>
            </div>

            {/* Social Icons Row */}
            <div className={styles.socialRow}>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className={styles.socialBtn} title="Facebook">f</a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className={styles.socialBtn} title="Instagram">📷</a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className={styles.socialBtn} title="LinkedIn">in</a>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className={styles.formPanel}>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>First Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Write first name..."
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className={styles.inputUnderline}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Last Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Doe"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className={styles.inputUnderline}
                  />
                </div>
              </div>

              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email</label>
                  <input 
                    type="email" 
                    required
                    placeholder="john@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={styles.inputUnderline}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Phone Number</label>
                  <PhoneInputField
                    value={phone}
                    onChange={(val) => setPhone(val)}
                    placeholder="98765 43210"
                    variant="underline"
                  />
                </div>
              </div>

              <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                <label className={styles.label}>Message</label>
                <textarea 
                  required
                  placeholder="Write your message..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className={styles.textareaUnderline}
                />
              </div>

              <div className={styles.submitRow}>
                <button type="submit" className={styles.btnSend} disabled={loading}>
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Floating Action Buttons */}
      <a 
        href="https://wa.me/919119112999" 
        target="_blank" 
        rel="noreferrer" 
        className={styles.floatingWhatsapp}
        title="Chat on WhatsApp"
      >
        💬
      </a>

      <a 
        href="tel:+919119112999" 
        className={styles.floatingPhone}
        title="Call Office"
      >
        📞
      </a>

      <LeadModal 
        isOpen={isLeadModalOpen} 
        onClose={() => setIsLeadModalOpen(false)} 
      />

      <Footer />
    </>
  );
}
