'use client';

import React, { useState } from 'react';
import { addInboundLead } from '@/utils/dataSync';
import { PhoneInputField } from '@/components/PhoneInputField/PhoneInputField';
import styles from './LeadModal.module.css';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledScrizianId?: string;
  prefilledRequirement?: string;
}

export const LeadModal: React.FC<LeadModalProps> = ({ isOpen, onClose, prefilledScrizianId, prefilledRequirement }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    serviceRequested: prefilledRequirement || 'Dedicated Developer / Staff Augmentation',
    message: prefilledScrizianId ? `I want to hire or interview Scrizian talent: ${prefilledScrizianId}` : (prefilledRequirement || '')
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen && !toastMsg) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result: any = await addInboundLead({
        name: formData.name,
        email: formData.email,
        phone: formData.phone.trim(),
        company: formData.company || 'Website Inquiry',
        serviceRequested: formData.serviceRequested,
        message: formData.message,
        scrizianIdReferenced: prefilledScrizianId || ''
      });

      if (result?.success) {
        setToastMsg('Hiring request submitted! Account lead will connect within 2 hrs.');
        onClose();
      } else {
        setToastMsg(result?.error || result?.message || 'Could not submit your request. Please try again.');
      }
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err) {
      setToastMsg('Network error. Please try again.');
      setTimeout(() => setToastMsg(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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

      {isOpen && (
        <div className={styles.overlay} onClick={onClose}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={onClose}>×</button>

            <h3 className={styles.title}>Hire Curated Tech Talent</h3>
            <p className={styles.subtitle}>
              All hiring requests are managed directly by <strong>Scriza Private Limited</strong>. Call us at <strong>+91 91191 12999</strong> or submit details below.
            </p>

            <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Your Name *</label>
              <input 
                type="text" 
                required 
                className={styles.input} 
                placeholder="e.g. John Doe" 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Work Email *</label>
              <input 
                type="email" 
                required 
                className={styles.input} 
                placeholder="john@company.com" 
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Phone / WhatsApp</label>
              <PhoneInputField
                value={formData.phone}
                onChange={(val) => setFormData({ ...formData, phone: val })}
                placeholder="98765 43210"
                variant="underline"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Engagement Model</label>
              <select 
                className={styles.select}
                value={formData.serviceRequested}
                onChange={e => setFormData({ ...formData, serviceRequested: e.target.value })}
              >
                <option>Dedicated Developer / Staff Augmentation</option>
                <option>Offshore Engineering Team</option>
                <option>Project-Based Delivery</option>
                <option>Interview Scrizian Talent</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Requirement Details *</label>
              <textarea 
                required 
                rows={3} 
                className={styles.textarea} 
                placeholder="Describe your tech stack, duration, or specific skills needed..."
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
              />
            </div>

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Submitting...' : 'Submit Hiring Requirement'}
            </button>
          </form>
        </div>
      </div>
    )}
    </>
  );
};
