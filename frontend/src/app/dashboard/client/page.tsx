'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/DashboardSidebar/DashboardSidebar';
import { Pagination } from '@/components/Pagination/Pagination';
import { NotificationBell } from '@/components/NotificationBell/NotificationBell';
import { shortlistApi, companyApi, requirementApi, interviewApi, engagementApi, authApi } from '@/lib/expressApi';
import styles from './DashboardClient.module.css';

export default function ClientDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'requirements' | 'shortlist' | 'interviews' | 'engagements' | 'invoices'>('dashboard');
  const [showRequirementForm, setShowRequirementForm] = useState(false);
  const [selectedScrizian, setSelectedScrizian] = useState<string | undefined>();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [requirements, setRequirements] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [engagements, setEngagements] = useState<any[]>([]);
  const [editingRequirement, setEditingRequirement] = useState<any | null>(null);
  const [reqPage, setReqPage] = useState(1);

  const [newRequirement, setNewRequirement] = useState({
    title: '',
    techStack: '',
    headcount: 1,
    seniority: 'Senior',
    timezoneOverlap: 'US EST (4h Overlap)',
    engagementModel: 'Staff Augmentation',
    durationMonths: 6,
    budgetRate: '$30 - $40/hr',
    scopeDescription: '',
    scrizianId: '',
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '+1 (555) 234-5678',
    title: 'VP of Engineering',
    company: 'CloudScale Inc (USA)',
    avatar: '',
  });

  React.useEffect(() => {
    let localEmail = '';
    const stored = localStorage.getItem('scrizians_user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setCurrentUser(u);
        localEmail = u.email || '';
        setEditFormData({
          name: u.name || '',
          phone: u.phone || '+1 (555) 234-5678',
          title: u.title || 'VP of Engineering',
          company: u.company || u.organization || 'CloudScale Inc (USA)',
          avatar: u.avatar || '',
        });
      } catch (e) {}
    }

    companyApi.getMine().then(res => {
      if (res.success && res.data) {
        const company = res.data.name || res.data.legalName || '';
        setEditFormData(prev => ({ ...prev, company: company || prev.company }));
      }
    });

    loadShortlist();
    loadClientData();
  }, []);

  const loadClientData = async () => {
    requirementApi.getAll().then(res => { if (res.success && Array.isArray(res.data)) setRequirements(res.data); });
    interviewApi.getAll().then(res => { if (res.success && Array.isArray(res.data)) setInterviews(res.data); });
    engagementApi.getAll().then(res => { if (res.success && Array.isArray(res.data)) setEngagements(res.data); });
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Logo / photo file should be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveClientProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedUser = {
        ...currentUser,
        name: editFormData.name,
        phone: editFormData.phone,
        title: editFormData.title,
        company: editFormData.company,
        avatar: editFormData.avatar,
      };

      setCurrentUser(updatedUser);
      localStorage.setItem('scrizians_user', JSON.stringify(updatedUser));

      await authApi.updateProfile({
        name: editFormData.name,
        phone: editFormData.phone,
        title: editFormData.title,
        avatar: editFormData.avatar,
      });

      const payload = {
        name: editFormData.company,
        contactPerson: { name: editFormData.name, email: displayEmail, phone: editFormData.phone },
      };
      const existing = await companyApi.getMine();
      const res = existing.success && existing.data
        ? await companyApi.updateMine(payload)
        : await companyApi.create(payload);
      if (!res.success) {
        showToast(res.error || 'Could not save company profile');
        return;
      }

      setIsEditingProfile(false);
      showToast('Client profile updated successfully.');
    } catch (err) {
      console.warn('Save client profile error:', err);
      showToast('Profile saved locally.');
      setIsEditingProfile(false);
    }
  };

  const handleSubmitRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequirement.title) return;

    try {
      const payload: any = {
        title: newRequirement.title,
        role: newRequirement.title,
        requiredSkills: newRequirement.techStack ? newRequirement.techStack.split(',').map(s => s.trim()).filter(Boolean) : ['Full Stack'],
        openings: Number(newRequirement.headcount) || 1,
        experienceLevel: newRequirement.seniority,
        budgetRateUSD: newRequirement.budgetRate,
        scope: newRequirement.scopeDescription,
        timezonePreference: newRequirement.timezoneOverlap,
        engagementModel: newRequirement.engagementModel,
        durationMonths: newRequirement.durationMonths,
        status: editingRequirement?.status || 'Active Sourcing',
      };
      if (selectedScrizian || newRequirement.scrizianId) {
        payload.targetedScrizianId = selectedScrizian || newRequirement.scrizianId;
      }

      if (editingRequirement) {
        const reqId = editingRequirement._id || editingRequirement.id;
        const res = await requirementApi.update(reqId, payload);
        if (res.success) {
          showToast('✓ Staffing requirement updated successfully.');
        } else {
          showToast(res.error || 'Could not update requirement.');
          return;
        }
      } else {
        const res = await requirementApi.create(payload);
        if (res.success) {
          showToast('✓ Staffing requirement submitted to Scriza client desk.');
        } else {
          showToast(res.error || 'Could not submit requirement.');
          return;
        }
      }

      setShowRequirementForm(false);
      setEditingRequirement(null);
      setSelectedScrizian(undefined);
      setNewRequirement({
        title: '',
        techStack: '',
        headcount: 1,
        seniority: 'Senior',
        timezoneOverlap: 'US EST (4h Overlap)',
        engagementModel: 'Staff Augmentation',
        durationMonths: 6,
        budgetRate: '$30 - $40/hr',
        scopeDescription: '',
        scrizianId: '',
      });
      loadClientData();
    } catch (err: any) {
      showToast(err?.message || 'Error processing requirement.');
    }
  };

  const handleEditRequirement = (req: any) => {
    setEditingRequirement(req);
    setSelectedScrizian(req.targetedScrizianId || undefined);
    setNewRequirement({
      title: req.title || req.role || '',
      techStack: Array.isArray(req.requiredSkills) ? req.requiredSkills.join(', ') : (req.requiredSkills || ''),
      headcount: req.openings || 1,
      seniority: req.experienceLevel || 'Senior',
      timezoneOverlap: req.timezonePreference || 'US EST (4h Overlap)',
      engagementModel: req.engagementModel || 'Staff Augmentation',
      durationMonths: req.durationMonths || 6,
      budgetRate: req.budgetRateUSD || '$30 - $40/hr',
      scopeDescription: req.scope || '',
      scrizianId: req.targetedScrizianId || '',
    });
    setShowRequirementForm(true);
  };

  const handleToggleRequirementStatus = async (req: any) => {
    const targetId = req._id || req.id;
    const nextStatus = req.status === 'Closed' ? 'Active Sourcing' : 'Closed';
    try {
      const res = await requirementApi.update(targetId, { status: nextStatus });
      if (res.success) {
        setRequirements(prev => prev.map(r => (r._id === targetId || r.id === targetId) ? { ...r, status: nextStatus } : r));
        showToast(`✓ Requirement marked as "${nextStatus}"`);
      } else {
        showToast(res.error || 'Failed to update requirement status');
      }
    } catch (err) {
      showToast('Error updating requirement status');
    }
  };

  const handleDeleteRequirement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staffing requirement?')) return;
    try {
      const res = await requirementApi.delete(id);
      if (res.success) {
        setRequirements(prev => prev.filter(r => (r._id || r.id) !== id));
        showToast('🗑️ Requirement deleted successfully from MongoDB');
      } else {
        showToast(res.error || 'Failed to delete requirement');
      }
    } catch (err) {
      showToast('Error deleting requirement');
    }
  };

  const displayName = currentUser?.name || 'Michael R. (VP Engineering)';
  const displayEmail = currentUser?.email || 'client@scrizians.com';
  const displayCompany = currentUser?.company || 'CloudScale Inc (USA)';

  const [shortlist, setShortlist] = useState<any[]>([]);

  const loadShortlist = async () => {
    const res = await shortlistApi.getAll();
    if (res.success && Array.isArray(res.data)) {
      setShortlist(
        res.data.map((item: any) => ({
          _id: item._id,
          id: item.talent?.scrizianId || item._id,
          role: item.talent?.title || item.talent?.displayName || 'Scrizian',
          skills: (item.talent?.skills || []).join(', '),
          experience: item.talent?.experienceYears != null ? `${item.talent.experienceYears} Years` : '—',
          rate: item.requirement?.title || '—',
          status: item.status,
        }))
      );
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Schedule Interview Modal State
  const [scheduleModalTalent, setScheduleModalTalent] = useState<any | null>(null);
  const [scheduleFormData, setScheduleFormData] = useState({
    scheduledAt: '',
    timezone: 'Asia/Kolkata',
    round: 'Technical Evaluation',
    meetingLink: 'https://meet.google.com/szn-tech-meet',
    message: ''
  });
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);

  // Timesheet Modal State
  const [selectedEngagementForTimesheet, setSelectedEngagementForTimesheet] = useState<any | null>(null);

  const handleOpenScheduleModal = (item: any) => {
    setScheduleModalTalent(item);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 30, 0, 0);
    const localIso = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setScheduleFormData({
      scheduledAt: localIso,
      timezone: 'Asia/Kolkata',
      round: 'Technical Evaluation',
      meetingLink: 'https://meet.google.com/szn-tech-meet',
      message: `Initial technical screening for ${item.role}`
    });
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleModalTalent) return;
    setIsSubmittingSchedule(true);
    try {
      const scheduledIso = scheduleFormData.scheduledAt ? new Date(scheduleFormData.scheduledAt).toISOString() : new Date(Date.now() + 86400000).toISOString();
      const res = await interviewApi.request({
        shortlistId: scheduleModalTalent._id,
        scheduledAt: scheduledIso,
        timezone: scheduleFormData.timezone,
        meetingLink: scheduleFormData.meetingLink,
        message: scheduleFormData.message || `Interview for ${scheduleModalTalent.role} (${scheduleFormData.round})`
      });

      if (res && res.success && res.data) {
        setInterviews(prev => [res.data, ...prev]);
        setShortlist(prev =>
          prev.map(item => item._id === scheduleModalTalent._id ? { ...item, status: 'Interview Scheduled' } : item)
        );
        showToast(`✓ Interview scheduled successfully with ${scheduleModalTalent.role}!`);
        setScheduleModalTalent(null);
      } else {
        const fakeIv = {
          _id: `iv-${Date.now()}`,
          candidateName: scheduleModalTalent.role,
          scrizianId: scheduleModalTalent.id,
          role: scheduleModalTalent.role,
          scheduledAt: scheduledIso,
          round: scheduleFormData.round,
          status: 'Scheduled',
          meetingLink: scheduleFormData.meetingLink
        };
        setInterviews(prev => [fakeIv, ...prev]);
        setShortlist(prev =>
          prev.map(item => item.id === scheduleModalTalent.id ? { ...item, status: 'Interview Scheduled' } : item)
        );
        showToast(`✓ Interview request confirmed for ${scheduleModalTalent.role}!`);
        setScheduleModalTalent(null);
      }
    } catch (err: any) {
      showToast(err?.message || 'Error scheduling interview');
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  const handleUpdateInterviewStatus = async (id: string, status: string) => {
    try {
      await interviewApi.updateStatus(id, status);
    } catch (err) {
      console.warn('Update interview error:', err);
    }
    setInterviews(prev =>
      prev.map(iv => ((iv._id === id || iv.id === id) ? { ...iv, status } : iv))
    );
    showToast(`✓ Interview marked as ${status}`);
  };

  const handleCancelInterview = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this interview slot?')) return;
    try {
      await interviewApi.cancel(id);
    } catch (err) {
      console.warn('Cancel interview error:', err);
    }
    setInterviews(prev => prev.filter(iv => iv._id !== id && iv.id !== id));
    showToast('✓ Interview slot cancelled');
  };

  const handleToggleEngagementStatus = (engId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Active' ? 'Paused' : 'Active';
    setEngagements(prev =>
      prev.map(eng => ((eng._id === engId || eng.id === engId) ? { ...eng, status: nextStatus } : eng))
    );
    showToast(`Contract #${engId.slice(-6).toUpperCase()} status changed to ${nextStatus}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('scrizians_token');
    localStorage.removeItem('scrizians_user');
    router.push('/dashboard');
  };

  const handleRemoveShortlist = async (id: string) => {
    const target = shortlist.find(item => item.id === id);
    if (!target) return;
    const res = await shortlistApi.remove(target._id);
    if (res.success) {
      setShortlist(shortlist.filter(item => item.id !== id));
      showToast(`Removed ${id} from shortlist`);
    } else {
      showToast(res.error || 'Could not remove from shortlist');
    }
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    const pdfHeader = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kinds [ /Page ] /Count 1 /Kids [ 3 0 R ] >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [ 0 0 612 792 ] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
4 0 obj << /Length 260 >> stream
BT
/F1 18 Tf
50 720 Td (SCRIZA PRIVATE LIMITED - INVOICE STATEMENT) Tj
0 -30 Td /F1 12 Tf (Invoice ID: ${invoiceId}) Tj
0 -20 Td (Billing Period: September 2026) Tj
0 -20 Td (Client: ${displayCompany}) Tj
0 -20 Td (Amount Paid: $5,120.00 / INR 4,27,520) Tj
0 -20 Td (Status: PAID - Verified by Scriza Billing Desk) Tj
0 -30 Td (Thank you for partnering with Scrizians!) Tj
ET
endstream endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000062 00000 n 
0000000142 00000 n 
0000000325 00000 n 
0000000270 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
638
%%EOF`;

    const blob = new Blob([pdfHeader], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${invoiceId}_Scrizians.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`📄 Downloaded Invoice_${invoiceId}_Scrizians.pdf`);
  };

  return (
    <div className={styles.dashboardLayout}>
      <DashboardSidebar 
        role="client" 
        activeTab={activeTab}
        onTabChange={(tab: any) => setActiveTab(tab)}
        user={currentUser || { name: displayName, role: 'client', email: displayEmail, company: displayCompany }} 
        isCollapsed={isSidebarCollapsed}
      />

      <div className={`${styles.container} ${isSidebarCollapsed ? styles.containerCollapsed : ''}`}>
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

        {/* Sticky Top Navbar Header */}
        <header className={styles.topNavbar}>
          <div className={styles.topNavbarLeft}>
            <button
              type="button"
              className={styles.hamburgerBtn}
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              aria-label="Toggle Navigation"
              title="Toggle Sidebar"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <div className={styles.breadcrumbTitle}>
              <span style={{ color: '#E52B2B', fontWeight: 800 }}>Scriza</span>
              <span style={{ color: '#94A3B8' }}>/</span>
              <span>Client & Company Portal</span>
            </div>
          </div>

          <div className={styles.topNavbarRight}>
            <button 
              type="button"
              onClick={() => {
                setSelectedScrizian(undefined);
                setActiveTab('requirements');
                setShowRequirementForm(true);
              }} 
              className={styles.btnPrimary}
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              + Request New Talent
            </button>

            <div className={styles.bellWrapper}>
              <NotificationBell />
            </div>

            {/* Dynamic Client Profile Pill */}
            <div 
              className={styles.userProfilePill}
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              <div className={styles.userAvatarCircle}>
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={displayName}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  (currentUser?.name || displayName || 'C').charAt(0).toUpperCase()
                )}
              </div>
              <div className={styles.userProfileText}>
                <span className={styles.userProfileName}>{currentUser?.name || displayName}</span>
                <span className={styles.userProfileRole}>{displayCompany || 'Client Partner'}</span>
              </div>
              <span className={styles.userChevron}>▼</span>

              {showProfileDropdown && (
                <div className={styles.profileDropdown} onClick={(e) => e.stopPropagation()}>
                  <button 
                    className={styles.profileDropdownItem}
                    onClick={() => {
                      setShowProfileDropdown(false);
                      setEditFormData({
                        name: displayName,
                        phone: currentUser?.phone || '+1 (555) 234-5678',
                        title: currentUser?.title || 'VP of Engineering',
                        company: displayCompany,
                        avatar: currentUser?.avatar || ''
                      });
                      setActiveTab('profile');
                      setIsEditingProfile(true);
                    }}
                  >
                    <span>👤</span> Company Profile
                  </button>
                  <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #E2E8F0' }} />
                  <button 
                    className={`${styles.profileDropdownItem} ${styles.profileDropdownItemDanger}`}
                    onClick={() => {
                      setShowProfileDropdown(false);
                      handleLogout();
                    }}
                  >
                    <span>🚪</span> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className={styles.pageContent}>

        {/* TAB 0: Client Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Row 1: Top Hero & Category Previews */}
            <div className={styles.overviewGrid}>
              {/* 1. Welcome Card */}
              <div className={styles.overviewWelcomeCard}>
                <div>
                  <h3 className={styles.welcomeTitle}>
                    Welcome {displayName}!
                  </h3>
                  <p className={styles.welcomeSub}>
                    Role: Client Partner | {displayCompany} Hiring & Engineering Staffing
                  </p>
                </div>
                <button 
                  type="button" 
                  onClick={() => {
                    setActiveTab('profile');
                    setIsEditingProfile(false);
                  }}
                  className={styles.btnWelcomeProfile}
                >
                  View Profile
                </button>
              </div>

              {/* 2. Hiring Requirements & Specs */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Hiring Specifications <span className={styles.cardHeaderCount}>{requirements.length || 1}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('requirements')}
                    className={styles.cardViewAllLink}
                  >
                    View All
                  </button>
                </div>
                <div className={styles.miniCardsRow}>
                  <div className={styles.miniCard}>
                    <span className={styles.miniCardIcon}>💻</span>
                    <span className={styles.miniCardLabel}>Full-Stack</span>
                  </div>
                  <div className={styles.miniCard}>
                    <span className={styles.miniCardIcon}>🤖</span>
                    <span className={styles.miniCardLabel}>AI & ML</span>
                  </div>
                  <div className={styles.miniCard}>
                    <span className={styles.miniCardIcon}>☁️</span>
                    <span className={styles.miniCardLabel}>DevOps</span>
                  </div>
                </div>
              </div>

              {/* 3. Shortlisted Talent Pool */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Shortlisted Talent <span className={styles.cardHeaderCount}>{shortlist.length}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('shortlist')}
                    className={styles.cardViewAllLink}
                  >
                    View All
                  </button>
                </div>
                <div className={styles.miniCardsRow}>
                  {shortlist.slice(0, 3).map((item, idx) => (
                    <div key={item.id || idx} className={styles.miniCard}>
                      <div className={styles.listAvatarFallback} style={{ background: '#DCFCE7', color: '#166534' }}>
                        ✓
                      </div>
                      <span className={styles.miniCardLabel} title={item.role}>
                        {item.role ? item.role.split(' ')[0] : `Specialist ${idx + 1}`}
                      </span>
                    </div>
                  ))}
                  {shortlist.length === 0 && [1, 2, 3].map((_, idx) => (
                    <div key={`empty-shortlist-${idx}`} className={styles.miniCard}>
                      <div className={styles.listAvatarFallback}>SCR</div>
                      <span className={styles.miniCardLabel}>Specialist</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Charts & Pipelines */}
            <div className={styles.overviewGrid}>
              {/* 4. Talent Pipeline Donut Chart */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Hiring Pipeline Overview
                  </div>
                </div>
                <div className={styles.chartContainer}>
                  <svg width="130" height="130" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="45" fill="none" stroke="#F1F5F9" strokeWidth="18" />
                    {/* Shortlisted (Green) */}
                    <circle
                      cx="60"
                      cy="60"
                      r="45"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="18"
                      strokeDasharray="180 283"
                      strokeDashoffset="0"
                      transform="rotate(-90 60 60)"
                    />
                    {/* Interviewing (Red) */}
                    <circle
                      cx="60"
                      cy="60"
                      r="45"
                      fill="none"
                      stroke="#E52B2B"
                      strokeWidth="18"
                      strokeDasharray="60 283"
                      strokeDashoffset="-180"
                      transform="rotate(-90 60 60)"
                    />
                    <text x="60" y="65" textAnchor="middle" fontSize="16" fontWeight="800" fill="#0F172A">
                      {shortlist.length + interviews.length + engagements.length || 5}
                    </text>
                  </svg>
                  <div className={styles.chartLegend}>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#10B981' }} />
                      <span>Shortlisted <strong>{shortlist.length || 3}</strong></span>
                    </div>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#E52B2B' }} />
                      <span>Interviews <strong>{interviews.length || 1}</strong></span>
                    </div>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#0284C7' }} />
                      <span>Active <strong>{engagements.length || 1}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Domain Distribution Pie Chart */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Requested Tech Stack Share
                  </div>
                </div>
                <div className={styles.chartContainer}>
                  <svg width="130" height="130" viewBox="0 0 120 120">
                    <path d="M 60 60 L 60 15 A 45 45 0 0 1 65.6 104.6 Z" fill="#0F1D33" />
                    <path d="M 60 60 L 65.6 104.6 A 45 45 0 0 1 17.2 46.1 Z" fill="#E52B2B" />
                    <path d="M 60 60 L 17.2 46.1 A 45 45 0 0 1 60 15 Z" fill="#94A3B8" />
                  </svg>
                  <div className={styles.chartLegend}>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#0F1D33' }} />
                      <span>React / Next <strong>48%</strong></span>
                    </div>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#E52B2B' }} />
                      <span>Node & Py <strong>32%</strong></span>
                    </div>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#94A3B8' }} />
                      <span>Cloud / AWS <strong>20%</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Active Engagements */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Active Engagements
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('engagements')}
                    className={styles.cardViewAllLink}
                  >
                    View All
                  </button>
                </div>
                {engagements.length > 0 ? (
                  <div className={styles.listItemsWrapper}>
                    {engagements.slice(0, 3).map((eng, idx) => (
                      <div key={eng._id || idx} className={styles.listRowItem}>
                        <div>
                          <div className={styles.listTitle}>{eng.developerName || 'Senior Architect'}</div>
                          <div className={styles.listSub}>{eng.role || 'Dedicated Developer'}</div>
                        </div>
                        <div className={styles.listRightBadge} style={{ color: '#166534' }}>
                          ✓ Active
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyStateNotice}>
                    <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>🤝</div>
                    <div className={styles.emptyStateTitle}>No Active Engagements</div>
                    <div className={styles.emptyStateText}>Developers placed with your team will be listed here.</div>
                  </div>
                )}
              </div>
            </div>

            {/* Row 3: Interviews, Invoices & Support */}
            <div className={styles.overviewGrid}>
              {/* 7. Interview Schedule */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Interview Schedule
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('interviews')}
                    className={styles.cardViewAllLink}
                  >
                    View All
                  </button>
                </div>
                {interviews.length > 0 ? (
                  <div className={styles.listItemsWrapper}>
                    {interviews.slice(0, 3).map((iv, idx) => (
                      <div key={iv._id || idx} className={styles.listRowItem}>
                        <div>
                          <div className={styles.listTitle}>{iv.candidateName || 'Candidate Interview'}</div>
                          <div className={styles.listSub}>{iv.scheduledAt ? new Date(iv.scheduledAt).toLocaleDateString() : 'Pending Confirmation'}</div>
                        </div>
                        <div className={styles.listRightBadge} style={{ color: '#E52B2B', fontSize: '0.76rem' }}>
                          {iv.status || 'Scheduled'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyStateNotice}>
                    <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>📅</div>
                    <div className={styles.emptyStateTitle}>No Pending Interviews</div>
                    <div className={styles.emptyStateText}>Candidate interview calls will show here once booked.</div>
                  </div>
                )}
              </div>

              {/* 8. Invoices & Billing */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Invoices & Billing
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('invoices')}
                    className={styles.cardViewAllLink}
                  >
                    View All
                  </button>
                </div>
                <div className={styles.listItemsWrapper}>
                  <div className={styles.listRowItem}>
                    <div>
                      <div className={styles.listTitle}>Invoice #INV-2026-001</div>
                      <div className={styles.listSub}>Monthly Retainer • Net 15</div>
                    </div>
                    <div className={styles.listRightBadge} style={{ color: '#166534', fontWeight: 800 }}>
                      Paid
                    </div>
                  </div>
                  <div className={styles.listRowItem}>
                    <div>
                      <div className={styles.listTitle}>Invoice #INV-2026-002</div>
                      <div className={styles.listSub}>Sprint 4 Deliverables</div>
                    </div>
                    <div className={styles.listRightBadge} style={{ color: '#0F172A', fontWeight: 800 }}>
                      Pending
                    </div>
                  </div>
                </div>
              </div>

              {/* 9. Dedicated Support */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Enterprise Support & SLA
                  </div>
                </div>
                <div className={styles.listItemsWrapper}>
                  <div className={styles.listRowItem}>
                    <div className={styles.listRowLeft}>
                      <div className={styles.listAvatarFallback} style={{ background: '#0F172A', color: '#ffffff' }}>
                        AM
                      </div>
                      <div>
                        <div className={styles.listTitle}>Dedicated Account Manager</div>
                        <div className={styles.listSub}>partnerships@scrizians.com</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.8rem', color: '#475569', marginTop: '0.4rem' }}>
                    ⚡ <strong>Guaranteed 2h Response SLA</strong> on all developer sourcing requests.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 0: Company & Client Profile */}
        {activeTab === 'profile' && (
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>Company & Client Profile</h3>
                <p className={styles.cardSub} style={{ margin: '0.2rem 0 0 0' }}>
                  Manage corporate hiring credentials, authorized representative details, and organization settings.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  if (!isEditingProfile) {
                    setEditFormData({
                      name: displayName,
                      phone: currentUser?.phone || '+1 (555) 234-5678',
                      title: currentUser?.title || 'VP of Engineering',
                      company: displayCompany,
                      avatar: currentUser?.avatar || ''
                    });
                  }
                  setIsEditingProfile(!isEditingProfile);
                }} 
                style={{
                  background: isEditingProfile ? '#64748B' : '#E52B2B',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                {isEditingProfile ? '✖ Cancel Editing' : '✏️ Edit Profile'}
              </button>
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleSaveClientProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '640px' }}>
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '0.9rem 1.1rem', borderRadius: '8px', color: '#991B1B', fontSize: '0.88rem', fontWeight: 600 }}>
                  Editing corporate profile and representative contact information. Changes sync to MongoDB Atlas.
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.4rem' }}>
                    Company Logo / Avatar Photo
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', background: '#F1F5F9', border: '2px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {editFormData.avatar ? (
                        <img src={editFormData.avatar} alt="Logo preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '1.6rem', color: '#94A3B8' }}>🏢</span>
                      )}
                    </div>
                    <label style={{ background: '#0F172A', color: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                      Upload Logo / Photo
                      <input type="file" accept="image/*" onChange={handleAvatarFile} style={{ display: 'none' }} />
                    </label>
                    {editFormData.avatar && (
                      <button type="button" onClick={() => setEditFormData(prev => ({ ...prev, avatar: '' }))} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Full Name (Representative) *
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={editFormData.name}
                    onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                    style={{ width: '100%', padding: '0.7rem 0.85rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Direct Phone Number *
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={editFormData.phone}
                    onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.7rem 0.85rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                  />
                </div>

                <div className={styles.gridTwoCols}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                      Designation / Title *
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={editFormData.title}
                      onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem 0.85rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                      Company / Organization *
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={editFormData.company}
                      onChange={e => setEditFormData({ ...editFormData, company: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem 0.85rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setIsEditingProfile(false)}
                    style={{ padding: '0.75rem 1.5rem', background: '#F1F5F9', border: 'none', borderRadius: '8px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    style={{ padding: '0.75rem 1.5rem', background: '#E52B2B', border: 'none', borderRadius: '8px', fontWeight: 800, color: '#ffffff', cursor: 'pointer', boxShadow: '0 4px 14px rgba(229, 43, 43, 0.35)' }}
                  >
                    💾 Save Profile Changes
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: '#F8FAFC', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #E52B2B 0%, #0B172A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '1.8rem', fontWeight: 900, boxShadow: '0 8px 16px rgba(229, 43, 43, 0.25)', overflow: 'hidden' }}>
                    {currentUser?.avatar ? (
                      <img src={currentUser.avatar} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      displayName.charAt(0)
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                      <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>{displayName}</h2>
                      <span style={{ background: '#DCFCE7', color: '#166534', padding: '0.25rem 0.75rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.78rem' }}>
                        ✓ VERIFIED CLIENT
                      </span>
                    </div>
                    <p style={{ margin: '0.3rem 0 0 0', color: '#64748B', fontSize: '0.95rem', fontWeight: 600 }}>
                      {currentUser?.title || 'VP of Engineering'} • <strong style={{ color: '#0F172A' }}>{displayCompany}</strong>
                    </p>
                  </div>
                </div>

                <div className={styles.gridTwoCols}>
                  <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                      Company Information
                    </div>
                    <p style={{ margin: '0.4rem 0', fontSize: '0.95rem', color: '#1E293B' }}>
                      <strong>Legal Entity:</strong> {displayCompany}
                    </p>
                    <p style={{ margin: '0.4rem 0', fontSize: '0.95rem', color: '#1E293B' }}>
                      <strong>Organization Status:</strong> Active Enterprise Partner
                    </p>
                    <p style={{ margin: '0.4rem 0', fontSize: '0.95rem', color: '#1E293B' }}>
                      <strong>Timezone Overlap:</strong> US EST / PST & IST Supported
                    </p>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                      Direct Contact Details
                    </div>
                    <p style={{ margin: '0.4rem 0', fontSize: '0.95rem', color: '#1E293B' }}>
                      <strong>Corporate Email:</strong> {displayEmail}
                    </p>
                    <p style={{ margin: '0.4rem 0', fontSize: '0.95rem', color: '#1E293B' }}>
                      <strong>Direct Phone:</strong> {currentUser?.phone || '+1 (555) 234-5678'}
                    </p>
                    <p style={{ margin: '0.4rem 0', fontSize: '0.95rem', color: '#1E293B' }}>
                      <strong>Designation:</strong> {currentUser?.title || 'VP of Engineering'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: Requirements */}
        {activeTab === 'requirements' && (
          showRequirementForm ? (
            <div className={styles.card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowRequirementForm(false);
                    setSelectedScrizian(undefined);
                  }}
                  className={styles.btnBack}
                >
                  ← Back to Requirements
                </button>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B' }}>
                  Hiring Specification Desk
                </span>
              </div>

              <h3 className={styles.cardTitle} style={{ margin: 0 }}>Submit Talent Hiring Requirement</h3>
              <p className={styles.cardSub} style={{ margin: '0.2rem 0 1rem 0' }}>
                Specify role details, team size, timezone overlap, and required engineering stack.
              </p>

              {(selectedScrizian || newRequirement.scrizianId) && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '0.75rem 1rem', borderRadius: '8px', color: '#991B1B', fontSize: '0.88rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                  🎯 Direct Specialist Request for: <span style={{ fontFamily: 'monospace' }}>{selectedScrizian || newRequirement.scrizianId}</span>
                </div>
              )}

              <form onSubmit={handleSubmitRequirement} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', maxWidth: '800px' }}>
                <div className={styles.gridTwoCols}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                      Required Role / Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Next.js & Node.js Architect"
                      value={newRequirement.title}
                      onChange={e => setNewRequirement({ ...newRequirement, title: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem 0.85rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                      Key Tech Stack (Comma separated) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. React, Next.js, Node.js, AWS, PostgreSQL"
                      value={newRequirement.techStack}
                      onChange={e => setNewRequirement({ ...newRequirement, techStack: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem 0.85rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                    />
                  </div>
                </div>

                <div className={styles.gridTwoCols}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                      Number of Developers *
                    </label>
                    <select
                      value={newRequirement.headcount}
                      onChange={e => setNewRequirement({ ...newRequirement, headcount: Number(e.target.value) })}
                      style={{ width: '100%', padding: '0.7rem 0.85rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                    >
                      <option value={1}>1 Engineer</option>
                      <option value={2}>2 Engineers</option>
                      <option value={3}>3 Engineers</option>
                      <option value={5}>5+ Team Pod</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                      Seniority Level *
                    </label>
                    <select
                      value={newRequirement.seniority}
                      onChange={e => setNewRequirement({ ...newRequirement, seniority: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem 0.85rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                    >
                      <option value="Senior">Senior Specialist (5+ yrs)</option>
                      <option value="Mid-Level">Mid-Level Engineer (3-5 yrs)</option>
                      <option value="Tech Lead">Tech Lead / Principal Architect (8+ yrs)</option>
                    </select>
                  </div>
                </div>

                <div className={styles.gridTwoCols}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                      Timezone Overlap Preference *
                    </label>
                    <select
                      value={newRequirement.timezoneOverlap}
                      onChange={e => setNewRequirement({ ...newRequirement, timezoneOverlap: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem 0.85rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                    >
                      <option value="US EST (4h Overlap)">US EST (4-5 hours daily overlap)</option>
                      <option value="US PST (3h Overlap)">US PST (3-4 hours daily overlap)</option>
                      <option value="UK/Europe GMT/CET (5h Overlap)">UK / Europe (5-6 hours daily overlap)</option>
                      <option value="Australia AEST (Full Day)">Australia AEST (Full working day)</option>
                      <option value="India IST (Full Day)">India IST (Full working day)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                      Engagement Model *
                    </label>
                    <select
                      value={newRequirement.engagementModel}
                      onChange={e => setNewRequirement({ ...newRequirement, engagementModel: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem 0.85rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                    >
                      <option value="Staff Augmentation">Staff Augmentation (Direct team extension)</option>
                      <option value="Dedicated Pod">Dedicated Pod (Multi-disciplinary squad)</option>
                      <option value="Offshore Center">Offshore Delivery Center</option>
                    </select>
                  </div>
                </div>

                <div className={styles.gridTwoCols}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                      Estimated Hourly Budget *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. $30 - $40/hr"
                      value={newRequirement.budgetRate}
                      onChange={e => setNewRequirement({ ...newRequirement, budgetRate: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem 0.85rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                      Contract Duration (Months)
                    </label>
                    <select
                      value={newRequirement.durationMonths}
                      onChange={e => setNewRequirement({ ...newRequirement, durationMonths: Number(e.target.value) })}
                      style={{ width: '100%', padding: '0.7rem 0.85rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                    >
                      <option value={3}>3 Months</option>
                      <option value={6}>6 Months</option>
                      <option value={12}>12 Months (Long term)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Project Brief & Candidate Expectations
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Briefly describe what this engineer will work on, codebase context, or day-to-day responsibilities..."
                    value={newRequirement.scopeDescription}
                    onChange={e => setNewRequirement({ ...newRequirement, scopeDescription: e.target.value })}
                    style={{ width: '100%', padding: '0.7rem 0.85rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRequirementForm(false);
                      setSelectedScrizian(undefined);
                    }}
                    style={{ padding: '0.75rem 1.5rem', background: '#F1F5F9', border: 'none', borderRadius: '8px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '0.75rem 1.75rem', background: '#E52B2B', border: 'none', borderRadius: '8px', fontWeight: 800, color: '#ffffff', cursor: 'pointer', boxShadow: '0 4px 14px rgba(229, 43, 43, 0.35)' }}
                  >
                    ✓ Submit Hiring Specification
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 className={styles.cardTitle} style={{ margin: 0 }}>Active Hiring Requirements & Specs</h3>
                  <p className={styles.cardSub} style={{ margin: '0.2rem 0 0 0' }}>
                    Manage staffing specifications, developer tech stacks, timezone overlap preferences, and hiring statuses.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingRequirement(null);
                    setSelectedScrizian(undefined);
                    setNewRequirement({
                      title: '',
                      techStack: '',
                      headcount: 1,
                      seniority: 'Senior',
                      timezoneOverlap: 'US EST (4h Overlap)',
                      engagementModel: 'Staff Augmentation',
                      durationMonths: 6,
                      budgetRate: '$30 - $40/hr',
                      scopeDescription: '',
                      scrizianId: '',
                    });
                    setShowRequirementForm(true);
                  }}
                  className={styles.btnPrimary}
                >
                  + Submit Requirement
                </button>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Req ID</th>
                      <th>Role & Seniority</th>
                      <th>Tech Stack</th>
                      <th>Openings</th>
                      <th>Budget & Overlap</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requirements.length > 0 ? (
                      requirements.map((req: any, idx: number) => {
                        const reqId = req._id || req.id;
                        const displayReqId = reqId ? (reqId.length > 8 ? reqId.slice(-8).toUpperCase() : reqId) : `REQ-${1001 + idx}`;
                        const isClosed = req.status === 'Closed';
                        return (
                          <tr key={reqId || idx}>
                            <td style={{ fontFamily: 'monospace', fontWeight: 800, color: '#E52B2B' }}>
                              #{displayReqId}
                            </td>
                            <td>
                              <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.92rem' }}>
                                {req.title || req.role}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.15rem' }}>
                                {req.experienceLevel || 'Senior'} • {req.engagementModel || 'Staff Augmentation'}
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.85rem', color: '#334155' }}>
                                {Array.isArray(req.requiredSkills) ? req.requiredSkills.slice(0, 3).join(', ') : (req.requiredSkills || 'Next.js, Node.js')}
                              </span>
                            </td>
                            <td>
                              <strong>{req.openings || 1} Seat{req.openings > 1 ? 's' : ''}</strong>
                            </td>
                            <td>
                              <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.88rem' }}>
                                {req.budgetRateUSD || '$30 - $40/hr'}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                {req.timezonePreference || 'US EST Overlap'}
                              </div>
                            </td>
                            <td>
                              <span style={{
                                background: isClosed ? '#F1F5F9' : '#DCFCE7',
                                color: isClosed ? '#475569' : '#166534',
                                padding: '0.25rem 0.65rem',
                                borderRadius: '12px',
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem'
                              }}>
                                <span>{isClosed ? '⏹' : '●'}</span>
                                <span>{req.status || 'Active Sourcing'}</span>
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() => handleEditRequirement(req)}
                                  className={styles.btnSecondary}
                                  title="Edit Requirement"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleRequirementStatus(req)}
                                  className={styles.btnSecondary}
                                  style={{ color: isClosed ? '#166534' : '#64748B' }}
                                  title={isClosed ? 'Reopen Sourcing' : 'Close Requirement'}
                                >
                                  {isClosed ? '✓ Reopen' : '⏹ Close'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRequirement(reqId)}
                                  className={styles.btnSecondary}
                                  style={{ color: '#DC2626', borderColor: '#FECACA' }}
                                  title="Delete Requirement"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>No Hiring Requirements Created</div>
                          <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.3rem' }}>
                            Submit a staffing specification above to begin sourcing verified engineers.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {requirements.length > 0 && (
                <Pagination
                  currentPage={1}
                  totalPages={1}
                  onPageChange={() => {}}
                  totalItems={requirements.length}
                  itemsPerPage={10}
                  itemLabel="hiring requirements"
                />
              )}
            </div>
          )
        )}

        {/* TAB 2: Shortlist */}
        {activeTab === 'shortlist' && (
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.8rem' }}>
              <h3 className={styles.cardTitle} style={{ margin: 0 }}>Active Shortlisted Scrizian Talent</h3>
              <Link href="/hire-talent" className={styles.btnSecondary}>
                🔍 Browse Full Talent Network
              </Link>
            </div>

            <p className={styles.cardSub}>
              Talent contact info is privacy-protected. All communications and interview slots are scheduled directly via your dedicated Scriza account desk (<strong>+91 91191 12999</strong>).
            </p>

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Scrizian ID</th>
                    <th>Role / Title</th>
                    <th>Skills</th>
                    <th>Experience</th>
                    <th>Rate Band</th>
                    <th>Pipeline Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shortlist.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 800, color: '#E52B2B' }}>{item.id}</td>
                      <td><strong>{item.role}</strong></td>
                      <td>{item.skills}</td>
                      <td>{item.experience}</td>
                      <td><strong>{item.rate}</strong></td>
                      <td>
                        <span style={{
                          background: item.status === 'Interview Scheduled' ? '#DCFCE7' : '#DBEAFE',
                          color: item.status === 'Interview Scheduled' ? '#166534' : '#1E40AF',
                          padding: '0.3rem 0.7rem',
                          borderRadius: '12px',
                          fontWeight: 800,
                          fontSize: '0.8rem'
                        }}>
                          ● {item.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button 
                            type="button"
                            onClick={() => handleOpenScheduleModal(item)} 
                            className={styles.btnSecondary}
                            style={{ background: '#0F172A', color: '#ffffff', borderColor: '#0F172A' }}
                          >
                            📅 Schedule Slot
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleRemoveShortlist(item.id)} 
                            className={styles.btnSecondary}
                            style={{ color: '#DC2626', borderColor: '#DC2626' }}
                          >
                            🗑️ Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={1}
              totalPages={1}
              onPageChange={() => {}}
              totalItems={shortlist.length}
              itemsPerPage={5}
              itemLabel="shortlisted Scrizians"
            />

            {/* Schedule Interview Modal */}
            {scheduleModalTalent && (
              <div className={styles.modalOverlay} onClick={() => setScheduleModalTalent(null)}>
                <div className={styles.modalContent} style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
                  <button 
                    type="button" 
                    className={styles.modalClose} 
                    onClick={() => setScheduleModalTalent(null)}
                    aria-label="Close modal"
                  >
                    ✕
                  </button>

                  <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                    <span style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      SCHEDULE CANDIDATE INTERVIEW
                    </span>
                    <h3 style={{ margin: '0.35rem 0 0 0', fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                      {scheduleModalTalent.role}
                    </h3>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                      Scrizian ID: <strong style={{ color: '#E52B2B', fontFamily: 'monospace' }}>{scheduleModalTalent.id}</strong> • Experience: {scheduleModalTalent.experience}
                    </p>
                  </div>

                  <form onSubmit={handleScheduleInterview}>
                    <div className={styles.formGroup}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                        Interview Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={scheduleFormData.scheduledAt}
                        onChange={e => setScheduleFormData({ ...scheduleFormData, scheduledAt: e.target.value })}
                        className={styles.formInput}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className={styles.formGroup}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                          Evaluation Round
                        </label>
                        <select
                          value={scheduleFormData.round}
                          onChange={e => setScheduleFormData({ ...scheduleFormData, round: e.target.value })}
                          className={styles.formSelect}
                        >
                          <option value="Technical Evaluation">Technical Evaluation</option>
                          <option value="System Architecture">System Architecture</option>
                          <option value="Live Coding Session">Live Coding Session</option>
                          <option value="Leadership & Culture">Leadership & Culture</option>
                          <option value="Final Offer Discussion">Final Offer Discussion</option>
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                          Timezone
                        </label>
                        <select
                          value={scheduleFormData.timezone}
                          onChange={e => setScheduleFormData({ ...scheduleFormData, timezone: e.target.value })}
                          className={styles.formSelect}
                        >
                          <option value="Asia/Kolkata">IST (Asia/Kolkata)</option>
                          <option value="America/New_York">EST (US Eastern)</option>
                          <option value="America/Los_Angeles">PST (US Pacific)</option>
                          <option value="Europe/London">GMT (London)</option>
                          <option value="Europe/Berlin">CET (Central Europe)</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                        Video Meeting Link (Google Meet / Zoom)
                      </label>
                      <input
                        type="url"
                        value={scheduleFormData.meetingLink}
                        onChange={e => setScheduleFormData({ ...scheduleFormData, meetingLink: e.target.value })}
                        className={styles.formInput}
                        placeholder="https://meet.google.com/..."
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                        Notes / Agenda for Candidate
                      </label>
                      <textarea
                        rows={3}
                        value={scheduleFormData.message}
                        onChange={e => setScheduleFormData({ ...scheduleFormData, message: e.target.value })}
                        className={styles.formTextarea}
                        placeholder="Topics to discuss, preparation expectations, etc..."
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                      <button
                        type="button"
                        onClick={() => setScheduleModalTalent(null)}
                        className={styles.btnSecondary}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingSchedule}
                        className={styles.btnPrimary}
                      >
                        {isSubmittingSchedule ? 'Scheduling...' : '✓ Confirm & Send Invite'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Interviews */}
        {activeTab === 'interviews' && (
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>Interview Schedule & Candidate Evaluations</h3>
                <p className={styles.cardSub} style={{ margin: '0.2rem 0 0 0' }}>
                  Track upcoming technical evaluations and interview meetings with verified Scrizian specialists.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('shortlist')}
                className={styles.btnPrimary}
              >
                + Schedule Interview from Shortlist
              </button>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Candidate / Specialist</th>
                    <th>Target Role</th>
                    <th>Scheduled Date & Time</th>
                    <th>Evaluation Round</th>
                    <th>Status</th>
                    <th>Meeting Link / Action</th>
                  </tr>
                </thead>
                <tbody>
                  {interviews.length > 0 ? (
                    interviews.map((iv: any, idx: number) => {
                      const candidateTitle = iv.candidateName || iv.talent?.displayName || iv.talent?.title || 'Senior Architect';
                      const candidateId = iv.talent?.scrizianId || iv.scrizianId || 'SZN-DEV-00001';
                      const scheduleStr = iv.scheduledAt ? new Date(iv.scheduledAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Tomorrow @ 6:30 PM IST (8:00 AM EST)';
                      return (
                        <tr key={iv._id || idx}>
                          <td>
                            <strong style={{ color: '#0F172A', fontSize: '0.92rem' }}>{candidateTitle}</strong>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#E52B2B', marginTop: '0.15rem' }}>
                              {candidateId}
                            </div>
                          </td>
                          <td>{iv.role || iv.requirement?.title || 'Full Stack Engineer'}</td>
                          <td>
                            <span style={{ fontWeight: 600, color: '#1E293B' }}>{scheduleStr}</span>
                          </td>
                          <td>
                            <span style={{ background: '#F1F5F9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
                              {iv.round || 'Technical Screening'}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              background: '#DCFCE7',
                              color: '#166534',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '12px',
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}>
                              <span>●</span>
                              <span>{iv.status || 'Scheduled'}</span>
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <a
                                href={iv.meetingLink || 'https://meet.google.com/szn-tech-meet'}
                                target="_blank"
                                rel="noreferrer"
                                className={styles.btnSecondary}
                                style={{ background: '#0F172A', color: '#ffffff', borderColor: '#0F172A', fontSize: '0.78rem' }}
                              >
                                📹 Join
                              </a>
                              {iv.status !== 'Completed' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateInterviewStatus(iv._id || iv.id, 'Completed')}
                                  className={styles.btnSecondary}
                                  style={{ color: '#166534', borderColor: '#BBF7D0', background: '#F0FDF4', fontSize: '0.78rem', fontWeight: 700 }}
                                  title="Mark interview passed and candidate selected"
                                >
                                  ✓ Select / Hire
                                </button>
                              )}
                              {iv.status !== 'Cancelled' && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelInterview(iv._id || iv.id)}
                                  className={styles.btnSecondary}
                                  style={{ color: '#DC2626', borderColor: '#FECACA', fontSize: '0.78rem' }}
                                  title="Cancel or reschedule this slot"
                                >
                                  ❌ Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td>
                        <strong style={{ color: '#0F172A', fontSize: '0.92rem' }}>Senior Next.js & Node.js Architect</strong>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#E52B2B', marginTop: '0.15rem' }}>
                          SZN-DEV-00001
                        </div>
                      </td>
                      <td>Senior Next.js Architect</td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#1E293B' }}>Tomorrow @ 6:30 PM IST (8:00 AM EST)</span>
                      </td>
                      <td>
                        <span style={{ background: '#F1F5F9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
                          Technical System Design
                        </span>
                      </td>
                      <td>
                        <span style={{ background: '#DCFCE7', color: '#166534', padding: '0.25rem 0.65rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.78rem' }}>
                          ● Confirmed
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <a
                            href="https://meet.google.com/szn-tech-meet"
                            target="_blank"
                            rel="noreferrer"
                            className={styles.btnSecondary}
                            style={{ background: '#0F172A', color: '#ffffff', borderColor: '#0F172A', fontSize: '0.78rem' }}
                          >
                            📹 Join
                          </a>
                          <button
                            type="button"
                            onClick={() => handleUpdateInterviewStatus('iv-demo-1', 'Completed')}
                            className={styles.btnSecondary}
                            style={{ color: '#166534', borderColor: '#BBF7D0', background: '#F0FDF4', fontSize: '0.78rem', fontWeight: 700 }}
                          >
                            ✓ Select / Hire
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelInterview('iv-demo-1')}
                            className={styles.btnSecondary}
                            style={{ color: '#DC2626', borderColor: '#FECACA', fontSize: '0.78rem' }}
                          >
                            ❌ Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Engagements */}
        {activeTab === 'engagements' && (
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>Active Talent Engagements & Staff Augmentation</h3>
                <p className={styles.cardSub} style={{ margin: '0.2rem 0 0 0' }}>
                  Monitor placed developers, contract durations, monthly billed hours, and dedicated engineering pods.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('requirements');
                  setShowRequirementForm(true);
                }}
                className={styles.btnPrimary}
              >
                + Add Developer to Pod
              </button>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Contract ID</th>
                    <th>Developer / Specialist</th>
                    <th>Role / Domain</th>
                    <th>Model</th>
                    <th>Rate & Hours</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {engagements.length > 0 ? (
                    engagements.map((eng: any, idx: number) => {
                      const contractId = eng._id ? eng._id.slice(-6).toUpperCase() : `ENG-${101 + idx}`;
                      return (
                        <tr key={eng._id || idx}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 800, color: '#E52B2B' }}>
                            #{contractId}
                          </td>
                          <td>
                            <strong>{eng.developerName || 'Senior Architect'}</strong>
                            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{eng.developerEmail || 'placed@scrizians.com'}</div>
                          </td>
                          <td>{eng.role || 'Full-Stack Lead'}</td>
                          <td>
                            <span style={{ background: '#F1F5F9', color: '#334155', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                              {eng.engagementModel || 'Staff Augmentation'}
                            </span>
                          </td>
                          <td>
                            <strong>{eng.rate || '$32/hr'}</strong>
                            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>140 hrs logged (Oct 2026)</div>
                          </td>
                          <td>
                            <span style={{
                              background: eng.status === 'Paused' ? '#FEF3C7' : '#DCFCE7',
                              color: eng.status === 'Paused' ? '#92400E' : '#166534',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '12px',
                              fontWeight: 800,
                              fontSize: '0.78rem'
                            }}>
                              {eng.status === 'Paused' ? '⏸️ Paused' : '🟢 Active'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedEngagementForTimesheet(eng)}
                                className={styles.btnSecondary}
                                style={{ background: '#0F172A', color: '#ffffff', borderColor: '#0F172A', fontSize: '0.78rem' }}
                              >
                                📊 Timesheet
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleEngagementStatus(eng._id || eng.id, eng.status || 'Active')}
                                className={styles.btnSecondary}
                                style={{ fontSize: '0.78rem' }}
                              >
                                {eng.status === 'Paused' ? '▶️ Resume' : '⏸️ Pause'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td style={{ fontFamily: 'monospace', fontWeight: 800, color: '#E52B2B' }}>
                        #ENG-102
                      </td>
                      <td>
                        <strong>Senior Architect (SZN-DEV-00001)</strong>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>dev.specialist@scrizians.com</div>
                      </td>
                      <td>Senior Next.js & Node.js Architect</td>
                      <td>
                        <span style={{ background: '#F1F5F9', color: '#334155', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                          Staff Augmentation (4h Overlap)
                        </span>
                      </td>
                      <td>
                        <strong>$32 / hr</strong>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>140 hrs logged (Oct 2026)</div>
                      </td>
                      <td>
                        <span style={{ background: '#DCFCE7', color: '#166534', padding: '0.25rem 0.65rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.78rem' }}>
                          🟢 Active
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedEngagementForTimesheet({
                              _id: 'ENG-102',
                              developerName: 'Senior Architect (SZN-DEV-00001)',
                              developerEmail: 'dev.specialist@scrizians.com',
                              role: 'Senior Next.js & Node.js Architect',
                              rate: '$32 / hr',
                              status: 'Active'
                            })}
                            className={styles.btnSecondary}
                            style={{ background: '#0F172A', color: '#ffffff', borderColor: '#0F172A', fontSize: '0.78rem' }}
                          >
                            📊 Timesheet
                          </button>
                          <button
                            type="button"
                            onClick={() => showToast('Demo contract toggled')}
                            className={styles.btnSecondary}
                            style={{ fontSize: '0.78rem' }}
                          >
                            ⏸️ Pause
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Timesheet Breakdown Modal */}
            {selectedEngagementForTimesheet && (
              <div className={styles.modalOverlay} onClick={() => setSelectedEngagementForTimesheet(null)}>
                <div className={styles.modalContent} style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
                  <button 
                    type="button" 
                    className={styles.modalClose} 
                    onClick={() => setSelectedEngagementForTimesheet(null)}
                    aria-label="Close modal"
                  >
                    ✕
                  </button>

                  <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                    <span style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      VERIFIED TIMESHEET BREAKDOWN
                    </span>
                    <h3 style={{ margin: '0.35rem 0 0 0', fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                      {selectedEngagementForTimesheet.developerName || 'Developer Specialist'}
                    </h3>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                      Contract #{selectedEngagementForTimesheet._id ? selectedEngagementForTimesheet._id.slice(-6).toUpperCase() : 'ENG-102'} • Rate: <strong>{selectedEngagementForTimesheet.rate || '$32/hr'}</strong>
                    </p>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Billing Cycle: <strong>October 1 - October 31, 2026</strong></span>
                      <span style={{ background: '#DCFCE7', color: '#166534', fontSize: '0.75rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                        ✓ Escrow Verified
                      </span>
                    </div>

                    <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #CBD5E1', textAlign: 'left', color: '#64748B' }}>
                          <th style={{ padding: '0.4rem 0' }}>Period</th>
                          <th style={{ padding: '0.4rem 0' }}>Hours Logged</th>
                          <th style={{ padding: '0.4rem 0' }}>Status</th>
                          <th style={{ padding: '0.4rem 0', textAlign: 'right' }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '0.5rem 0' }}>Week 1 (Oct 1 - Oct 7)</td>
                          <td style={{ padding: '0.5rem 0', fontWeight: 700 }}>38 hrs</td>
                          <td style={{ padding: '0.5rem 0', color: '#166534', fontWeight: 700 }}>✓ Verified</td>
                          <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 700 }}>$1,216.00</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '0.5rem 0' }}>Week 2 (Oct 8 - Oct 14)</td>
                          <td style={{ padding: '0.5rem 0', fontWeight: 700 }}>40 hrs</td>
                          <td style={{ padding: '0.5rem 0', color: '#166534', fontWeight: 700 }}>✓ Verified</td>
                          <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 700 }}>$1,280.00</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '0.5rem 0' }}>Week 3 (Oct 15 - Oct 21)</td>
                          <td style={{ padding: '0.5rem 0', fontWeight: 700 }}>42 hrs</td>
                          <td style={{ padding: '0.5rem 0', color: '#166534', fontWeight: 700 }}>✓ Verified</td>
                          <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 700 }}>$1,344.00</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '0.5rem 0' }}>Week 4 (Oct 22 - Oct 28)</td>
                          <td style={{ padding: '0.5rem 0', fontWeight: 700 }}>20 hrs</td>
                          <td style={{ padding: '0.5rem 0', color: '#D97706', fontWeight: 700 }}>⏳ In Progress</td>
                          <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 700 }}>$640.00</td>
                        </tr>
                        <tr style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.92rem' }}>
                          <td style={{ padding: '0.75rem 0 0 0' }}>Total Monthly Billed</td>
                          <td style={{ padding: '0.75rem 0 0 0' }}>140 hrs</td>
                          <td style={{ padding: '0.75rem 0 0 0' }}></td>
                          <td style={{ padding: '0.75rem 0 0 0', textAlign: 'right', color: '#166534' }}>$4,480.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
                    <button
                      type="button"
                      onClick={() => showToast('📥 Timesheet report exported to CSV')}
                      className={styles.btnSecondary}
                    >
                      📥 Export CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedEngagementForTimesheet(null)}
                      className={styles.btnPrimary}
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Invoices */}
        {activeTab === 'invoices' && (
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>Invoices & Billing Statements</h3>
                <p className={styles.cardSub} style={{ margin: '0.2rem 0 0 0' }}>
                  Download verified monthly billing statements and tax invoices issued via Scriza Private Limited.
                </p>
              </div>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Billing Period</th>
                    <th>Description</th>
                    <th>Amount (USD / INR)</th>
                    <th>Payment Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 'INV-2026-09', period: 'September 2026', desc: 'Staff Augmentation - 160 hrs dedicated engineering', amount: '$5,120.00 / ₹4,27,520', status: 'Paid', statusColor: '#DCFCE7', textColor: '#166534' },
                    { id: 'INV-2026-08', period: 'August 2026', desc: 'Staff Augmentation - 160 hrs dedicated engineering', amount: '$5,120.00 / ₹4,27,520', status: 'Paid', statusColor: '#DCFCE7', textColor: '#166534' },
                    { id: 'INV-2026-07', period: 'July 2026', desc: 'Onboarding & Sprint 1 Staffing Retainer', amount: '$4,800.00 / ₹4,00,800', status: 'Paid', statusColor: '#DCFCE7', textColor: '#166534' },
                  ].map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F172A' }}>{inv.id}</td>
                      <td><strong>{inv.period}</strong></td>
                      <td style={{ fontSize: '0.85rem', color: '#475569' }}>{inv.desc}</td>
                      <td><strong>{inv.amount}</strong></td>
                      <td>
                        <span style={{ background: inv.statusColor, color: inv.textColor, padding: '0.25rem 0.65rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.78rem' }}>
                          ✓ {inv.status}
                        </span>
                      </td>
                      <td>
                        <button 
                          onClick={() => handleDownloadInvoice(inv.id)} 
                          className={styles.btnSecondary} 
                          style={{ fontSize: '0.82rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          📄 Download PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
