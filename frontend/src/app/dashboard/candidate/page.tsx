'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/DashboardSidebar/DashboardSidebar';
import { Pagination } from '@/components/Pagination/Pagination';
import { NotificationBell } from '@/components/NotificationBell/NotificationBell';
import { jobApi } from '@/lib/expressApi';
import styles from '../client/DashboardClient.module.css';

export default function CandidateDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'resume' | 'applications' | 'interview_status'>('dashboard');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [resumeFileName, setResumeFileName] = useState('My_Updated_Resume_2026.pdf (1.8 MB)');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('scrizians_token');
    localStorage.removeItem('scrizians_user');
    router.push('/dashboard');
  };

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '+91 98765 43210',
    skills: 'Next.js, Node.js, React, AWS',
    experience: '7+ Years',
    title: 'Senior Full-Stack Architect',
    avatar: ''
  });

  const [confirmedAttendance, setConfirmedAttendance] = useState(false);
  const [rescheduleRequested, setRescheduleRequested] = useState(false);

  useEffect(() => {
    let localEmail = '';
    const stored = localStorage.getItem('scrizians_user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setCurrentUser(u);
        localEmail = u.email || '';
        setResumeFileName('My_Updated_Resume_2026.pdf (1.8 MB)');
        setEditFormData({
          name: u.name || '',
          phone: u.phone || '+91 98765 43210',
          skills: u.skills || 'Next.js, Node.js, React, AWS',
          experience: u.experience || '7+ Years',
          title: u.title || 'Senior Full-Stack Architect',
          avatar: u.avatar || u.avatarUrl || ''
        });
      } catch (e) {}
    }

    jobApi.getMyApplications().then(res => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map((app: any) => ({
          id: app._id || app.id,
          jobSlug: app.job?.slug || app.jobSlug || app.jobId,
          jobTitle: app.job?.title || app.jobSlug || 'Software Engineer',
          company: app.job?.company || 'Scriza Client Partner',
          appliedDate: app.appliedAt ? new Date(app.appliedAt).toISOString().split('T')[0] : '2026-10-19',
          status: app.status || 'Applied',
          stage: app.stage || (app.status === 'Applied' ? 'Application Received' : app.status)
        }));
        setApplications(mapped);
      }
    });
  }, []);

  const displayName = currentUser?.name || editFormData.name || 'Job Candidate';
  const displayEmail = currentUser?.email || 'candidate@scrizians.com';
  const displayId = currentUser?.scrizianId || currentUser?.id || 'APP-901';
  const displayPhone = currentUser?.phone || editFormData.phone;
  const displaySkills = currentUser?.skills || editFormData.skills;
  const displayExperience = currentUser?.experience || editFormData.experience;
  const displayTitle = currentUser?.title || editFormData.title;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleWithdrawApplication = async (appId: string) => {
    if (!confirm('Are you sure you want to withdraw your application?')) return;
    try {
      const res = await jobApi.withdrawApplication(appId);
      if (res.success) {
        setApplications(prev => prev.map(a => (a.id === appId || a._id === appId) ? { ...a, status: 'Withdrawn', stage: 'Application Withdrawn' } : a));
        showToast('✓ Application withdrawn successfully.');
      } else {
        showToast(res.error || res.message || 'Could not withdraw application');
      }
    } catch (err: any) {
      showToast('Error withdrawing application');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedUser = {
        ...currentUser,
        name: editFormData.name,
        phone: editFormData.phone,
        skills: editFormData.skills,
        experience: editFormData.experience,
        title: editFormData.title,
        avatar: editFormData.avatar,
        avatarUrl: editFormData.avatar
      };

      setCurrentUser(updatedUser);
      localStorage.setItem('scrizians_user', JSON.stringify(updatedUser));

      setIsEditingProfile(false);
      showToast('Profile updated.');
    } catch (err) {
      console.warn('Save profile error:', err);
      showToast('🎉 Profile saved locally!');
      setIsEditingProfile(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const displayStr = `${file.name} (${sizeMB} MB)`;
      setResumeFileName(displayStr);
      showToast(`🎉 Resume "${file.name}" uploaded successfully!`);
    }
  };

  const [applications, setApplications] = useState<any[]>([
    {
      id: 'APP-901',
      jobSlug: 'senior-full-stack-architect',
      jobTitle: 'Senior Full-Stack Architect',
      company: 'CloudScale Inc (USA)',
      appliedDate: '2026-10-01',
      status: 'Interview Scheduled',
      stage: 'Tech Interview Round 2'
    },
    {
      id: 'APP-902',
      jobSlug: 'lead-frontend-specialist',
      jobTitle: 'Lead Frontend Specialist',
      company: 'Fintech Systems (UK)',
      appliedDate: '2026-09-28',
      status: 'Under Review',
      stage: 'Profile Assessment'
    }
  ]);

  return (
    <div className={styles.dashboardLayout}>
      <DashboardSidebar 
        role="candidate" 
        activeTab={activeTab}
        onTabChange={(tab: any) => setActiveTab(tab)}
        user={currentUser || { name: displayName, role: 'candidate', email: displayEmail, scrizianId: displayId }} 
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
              <span>Candidate Portal</span>
            </div>
          </div>

          <div className={styles.topNavbarRight}>
            <span style={{ background: '#DCFCE7', color: '#166534', padding: '0.35rem 0.8rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem' }}>
              ✓ PROFILE VERIFIED
            </span>

            <div className={styles.bellWrapper}>
              <NotificationBell />
            </div>

            {/* Dynamic Candidate Profile Pill */}
            <div 
              className={styles.userProfilePill}
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              <div className={styles.userAvatarCircle}>
                {currentUser?.avatar || currentUser?.avatarUrl ? (
                  <img src={currentUser.avatar || currentUser.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  (currentUser?.name || displayName || 'C').charAt(0).toUpperCase()
                )}
              </div>
              <div className={styles.userProfileText}>
                <span className={styles.userProfileName}>{currentUser?.name || displayName}</span>
                <span className={styles.userProfileRole}>Job Candidate</span>
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
                        phone: displayPhone,
                        skills: displaySkills,
                        experience: displayExperience,
                        title: displayTitle,
                        avatar: currentUser?.avatar || ''
                      });
                      setActiveTab('profile');
                      setIsEditingProfile(true);
                    }}
                  >
                    <span>👤</span> My Profile
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

        {/* TAB 0: Candidate Dashboard Overview */}
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
                    Role: Candidate & Specialist Applicant | Scrizian ID: SCR-CAND-4029
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

              {/* 2. Applications Pipeline */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Applications Pipeline <span className={styles.cardHeaderCount}>3</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('applications')}
                    className={styles.cardViewAllLink}
                  >
                    View All
                  </button>
                </div>
                <div className={styles.miniCardsRow}>
                  <div className={styles.miniCard}>
                    <span className={styles.miniCardIcon}>📄</span>
                    <span className={styles.miniCardLabel}>Submitted</span>
                  </div>
                  <div className={styles.miniCard}>
                    <span className={styles.miniCardIcon}>🔍</span>
                    <span className={styles.miniCardLabel}>Screening</span>
                  </div>
                  <div className={styles.miniCard}>
                    <span className={styles.miniCardIcon}>📅</span>
                    <span className={styles.miniCardLabel}>Interview</span>
                  </div>
                </div>
              </div>

              {/* 3. Credentials & Resume */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Resume & Credentials
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('resume')}
                    className={styles.cardViewAllLink}
                  >
                    View All
                  </button>
                </div>
                <div className={styles.miniCardsRow}>
                  <div className={styles.miniCard}>
                    <span className={styles.miniCardIcon}>📄</span>
                    <span className={styles.miniCardLabel}>PDF Resume</span>
                  </div>
                  <div className={styles.miniCard}>
                    <span className={styles.miniCardIcon}>💼</span>
                    <span className={styles.miniCardLabel}>7+ Years</span>
                  </div>
                  <div className={styles.miniCard}>
                    <span className={styles.miniCardIcon}>⭐</span>
                    <span className={styles.miniCardLabel}>Top Match</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Charts & Pipelines */}
            <div className={styles.overviewGrid}>
              {/* 4. Application Journey Donut Chart */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Hiring Stage Progress
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
                      strokeDasharray="140 283"
                      strokeDashoffset="0"
                      transform="rotate(-90 60 60)"
                    />
                    {/* In Review (Brand Red) */}
                    <circle
                      cx="60"
                      cy="60"
                      r="45"
                      fill="none"
                      stroke="#E52B2B"
                      strokeWidth="18"
                      strokeDasharray="100 283"
                      strokeDashoffset="-140"
                      transform="rotate(-90 60 60)"
                    />
                    <text x="60" y="65" textAnchor="middle" fontSize="16" fontWeight="800" fill="#0F172A">
                      3
                    </text>
                  </svg>
                  <div className={styles.chartLegend}>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#10B981' }} />
                      <span>Interview <strong>1</strong></span>
                    </div>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#E52B2B' }} />
                      <span>Screening <strong>1</strong></span>
                    </div>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#F59E0B' }} />
                      <span>Applied <strong>1</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Skill Match Share Pie Chart */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Skill Match Distribution
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
                      <span>Next & React <strong>50%</strong></span>
                    </div>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#E52B2B' }} />
                      <span>Node & APIs <strong>30%</strong></span>
                    </div>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#94A3B8' }} />
                      <span>AWS Cloud <strong>20%</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Upcoming Interviews */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Interview Schedule
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('interview_status')}
                    className={styles.cardViewAllLink}
                  >
                    View All
                  </button>
                </div>
                <div className={styles.listItemsWrapper}>
                  <div className={styles.listRowItem}>
                    <div>
                      <div className={styles.listTitle}>Round 2: Technical Architecture</div>
                      <div className={styles.listSub}>Scriza Client Partner • Google Meet</div>
                    </div>
                    <div className={styles.listRightBadge} style={{ color: '#166534', fontWeight: 800 }}>
                      Friday, 3 PM
                    </div>
                  </div>
                  <div className={styles.listRowItem}>
                    <div>
                      <div className={styles.listTitle}>Round 1: Screening Call</div>
                      <div className={styles.listSub}>Senior Talent Specialist</div>
                    </div>
                    <div className={styles.listRightBadge} style={{ color: '#166534' }}>
                      ✓ Passed
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Jobs, Timeline & Credentials */}
            <div className={styles.overviewGrid}>
              {/* 7. Recommended Jobs */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Recommended Roles
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('applications')}
                    className={styles.cardViewAllLink}
                  >
                    View All
                  </button>
                </div>
                <div className={styles.listItemsWrapper}>
                  <div className={styles.listRowItem}>
                    <div>
                      <div className={styles.listTitle}>Senior Full-Stack Architect</div>
                      <div className={styles.listSub}>CloudScale Inc • $40 - $55/hr</div>
                    </div>
                    <div className={styles.listRightBadge} style={{ color: '#E52B2B', fontSize: '0.76rem', fontWeight: 700 }}>
                      Active
                    </div>
                  </div>
                  <div className={styles.listRowItem}>
                    <div>
                      <div className={styles.listTitle}>Lead Next.js & Node Developer</div>
                      <div className={styles.listSub}>FinTech Global • $45 - $60/hr</div>
                    </div>
                    <div className={styles.listRightBadge} style={{ color: '#E52B2B', fontSize: '0.76rem', fontWeight: 700 }}>
                      Active
                    </div>
                  </div>
                </div>
              </div>

              {/* 8. Pipeline Timeline */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Recent Stage Updates
                  </div>
                </div>
                <div className={styles.listItemsWrapper}>
                  <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.8rem', color: '#334155' }}>
                    ✅ <strong>Resume Approved:</strong> High match score for Senior Cloud Architect positions.
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.8rem', color: '#334155' }}>
                    📅 <strong>Interview Scheduled:</strong> Technical round confirmed for Friday.
                  </div>
                </div>
              </div>

              {/* 9. Candidate Onboarding Status */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Verification Status
                  </div>
                </div>
                <div className={styles.listItemsWrapper}>
                  <div style={{ background: '#DCFCE7', border: '1px solid #BBF7D0', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>✓</div>
                    <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.95rem' }}>Verified Candidate Profile</div>
                    <div style={{ fontSize: '0.78rem', color: '#15803D', marginTop: '0.2rem' }}>
                      Ready for enterprise partner matching
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: Profile */}
        {activeTab === 'profile' && (
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>Candidate Profile Details</h3>
                <p className={styles.cardSub} style={{ margin: '0.2rem 0 0 0' }}>
                  Update your personal background, contact info, and career preferences.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  if (!isEditingProfile) {
                    setEditFormData({
                      name: displayName,
                      phone: displayPhone,
                      skills: displaySkills,
                      experience: displayExperience,
                      title: displayTitle,
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
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '640px' }}>
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '0.9rem 1.1rem', borderRadius: '8px', color: '#991B1B', fontSize: '0.88rem', fontWeight: 600 }}>
                  Editing applicant profile credentials. Changes will be saved locally and sync with applications.
                </div>

                {/* Profile Photo Upload Field */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: editFormData.avatar ? `url(${editFormData.avatar}) center/cover no-repeat` : '#E2E8F0',
                    border: '2px solid #E52B2B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem',
                    color: '#64748B',
                    flexShrink: 0,
                    overflow: 'hidden'
                  }}>
                    {!editFormData.avatar && (displayName.charAt(0).toUpperCase() || '👤')}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.25rem' }}>
                      Profile Photo
                    </label>
                    <label style={{
                      display: 'inline-block',
                      background: '#0B172A',
                      color: '#ffffff',
                      padding: '0.4rem 0.9rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}>
                      📷 Upload Photo
                      <input 
                        type="file" 
                        accept="image/*" 
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setEditFormData(prev => ({ ...prev, avatar: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {editFormData.avatar && (
                      <button 
                        type="button" 
                        onClick={() => setEditFormData(prev => ({ ...prev, avatar: '' }))} 
                        style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', marginLeft: '0.75rem' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Full Name *
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
                    Phone Number *
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={editFormData.phone}
                    onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.7rem 0.85rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Primary Skill Tags *
                  </label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Next.js, React, Node.js, AWS"
                    value={editFormData.skills}
                    onChange={e => setEditFormData({ ...editFormData, skills: e.target.value })}
                    style={{ width: '100%', padding: '0.7rem 0.85rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                  />
                </div>

                <div className={styles.gridTwoCols}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                      Total Experience *
                    </label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. 5+ Years"
                      value={editFormData.experience}
                      onChange={e => setEditFormData({ ...editFormData, experience: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem 0.85rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                      Desired Role / Title *
                    </label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Full-Stack Developer"
                      value={editFormData.title}
                      onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
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
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #E52B2B 0%, #0B172A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '1.8rem', fontWeight: 900, boxShadow: '0 8px 16px rgba(229, 43, 43, 0.25)' }}>
                    {displayName.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                      <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>{displayName}</h2>
                      <span style={{ background: '#DCFCE7', color: '#166534', padding: '0.25rem 0.75rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.78rem' }}>
                        ✓ PROFILE VERIFIED
                      </span>
                    </div>
                    <p style={{ margin: '0.3rem 0 0 0', color: '#64748B', fontSize: '0.95rem', fontWeight: 600 }}>
                      {displayTitle} • Applicant ID: <strong style={{ color: '#E52B2B', fontFamily: 'monospace' }}>{displayId}</strong>
                    </p>
                  </div>
                </div>

                <div className={styles.gridTwoCols}>
                  <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                      Personal & Contact
                    </div>
                    <p style={{ margin: '0.4rem 0', fontSize: '0.95rem', color: '#1E293B' }}>
                      <strong>Full Name:</strong> {displayName}
                    </p>
                    <p style={{ margin: '0.4rem 0', fontSize: '0.95rem', color: '#1E293B' }}>
                      <strong>Email:</strong> {displayEmail}
                    </p>
                    <p style={{ margin: '0.4rem 0', fontSize: '0.95rem', color: '#1E293B' }}>
                      <strong>Phone:</strong> {displayPhone}
                    </p>
                    <p style={{ margin: '0.4rem 0', fontSize: '0.95rem', color: '#1E293B' }}>
                      <strong>Primary Skill:</strong> {displaySkills}
                    </p>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                      Career & Availability
                    </div>
                    <p style={{ margin: '0.4rem 0', fontSize: '0.95rem', color: '#1E293B' }}>
                      <strong>Total Experience:</strong> {displayExperience}
                    </p>
                    <p style={{ margin: '0.4rem 0', fontSize: '0.95rem', color: '#1E293B' }}>
                      <strong>Desired Role:</strong> {displayTitle}
                    </p>
                    <p style={{ margin: '0.4rem 0', fontSize: '0.95rem', color: '#1E293B' }}>
                      <strong>Notice Period:</strong> Immediate / 15 Days
                    </p>
                    <p style={{ margin: '0.4rem 0', fontSize: '0.95rem', color: '#1E293B' }}>
                      <strong>Verification Status:</strong> Verified by Scriza Ops Desk
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Resume & Credentials */}
        {activeTab === 'resume' && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Resume & Credentials</h3>
            <p className={styles.cardSub}>Upload and manage your CV, certificates, and portfolio documents.</p>

            <div style={{ background: '#FFFBEB', border: '2px solid #FCD34D', padding: '1.2rem', borderRadius: '8px', marginTop: '1rem' }}>
              <div style={{ fontWeight: 800, color: '#78350F' }}>📄 Primary Resume Attached:</div>
              <div style={{ fontSize: '0.9rem', color: '#92400E', marginTop: '0.3rem', fontWeight: 700 }}>{resumeFileName}</div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                accept=".pdf,.doc,.docx" 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                style={{ marginTop: '0.8rem', background: '#0F172A', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                📤 Upload Updated Resume PDF
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: Job Applications */}
        {activeTab === 'applications' && (
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>Job Applications</h3>
                <p className={styles.cardSub} style={{ margin: '0.2rem 0 0 0' }}>
                  Track your submitted job applications, interview stages, and status updates across client opportunities.
                </p>
              </div>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>App ID</th>
                    <th>Target Role & Company</th>
                    <th>Applied Date</th>
                    <th>Current Status</th>
                    <th>Hiring Stage</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.length > 0 ? (
                    applications.map(app => {
                      const isWithdrawn = app.status === 'Withdrawn';
                      const isRejected = app.status === 'Rejected';
                      const isInterview = app.status === 'Interview Scheduled' || app.status === 'Shortlisted';
                      const isOffered = app.status === 'Offered' || app.status === 'Joined';

                      let badgeBg = '#DBEAFE';
                      let badgeColor = '#1E40AF';
                      if (isOffered) {
                        badgeBg = '#DCFCE7';
                        badgeColor = '#166534';
                      } else if (isInterview) {
                        badgeBg = '#E0F2FE';
                        badgeColor = '#0369A1';
                      } else if (isWithdrawn) {
                        badgeBg = '#F1F5F9';
                        badgeColor = '#64748B';
                      } else if (isRejected) {
                        badgeBg = '#FEF2F2';
                        badgeColor = '#B91C1C';
                      }

                      return (
                        <tr key={app.id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 800, color: '#E52B2B' }}>
                            #{app.id.length > 8 ? app.id.slice(-8).toUpperCase() : app.id}
                          </td>
                          <td>
                            <strong style={{ color: '#0F172A', fontSize: '0.92rem' }}>{app.jobTitle}</strong><br/>
                            <span style={{ fontSize: '0.82rem', color: '#64748B' }}>{app.company}</span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.82rem', color: '#64748B' }}>{app.appliedDate}</span>
                          </td>
                          <td>
                            <span style={{
                              background: badgeBg,
                              color: badgeColor,
                              padding: '0.25rem 0.65rem',
                              borderRadius: '12px',
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}>
                              <span>●</span>
                              <span>{app.status}</span>
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: '#334155', fontSize: '0.85rem' }}>{app.stage}</strong>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <a
                                href={app.jobSlug ? `/jobs/${app.jobSlug}` : '/jobs'}
                                target="_blank"
                                rel="noreferrer"
                                className={styles.btnSecondary}
                                style={{ fontSize: '0.78rem' }}
                                title="View Job Description"
                              >
                                👁️ View Post
                              </a>
                              {app.status === 'Offered' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setApplications(prev =>
                                        prev.map(a => a.id === app.id ? { ...a, status: 'Joined', stage: 'Offer Accepted & Onboarding' } : a)
                                      );
                                      showToast('🎉 Congratulations! Offer accepted. Onboarding team will contact you.');
                                    }}
                                    className={styles.btnSecondary}
                                    style={{ color: '#166534', borderColor: '#BBF7D0', background: '#DCFCE7', fontSize: '0.78rem', fontWeight: 800 }}
                                  >
                                    🎉 Accept Offer
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!window.confirm('Are you sure you want to decline this job offer?')) return;
                                      setApplications(prev =>
                                        prev.map(a => a.id === app.id ? { ...a, status: 'Rejected', stage: 'Offer Declined' } : a)
                                      );
                                      showToast('Offer declined.');
                                    }}
                                    className={styles.btnSecondary}
                                    style={{ color: '#DC2626', borderColor: '#FECACA', fontSize: '0.78rem' }}
                                  >
                                    Decline
                                  </button>
                                </>
                              )}
                              {(app.status === 'Interview Scheduled' || app.status === 'Interview') && (
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('interview_status')}
                                  className={styles.btnSecondary}
                                  style={{ background: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE', fontSize: '0.78rem', fontWeight: 700 }}
                                >
                                  📅 View Slot
                                </button>
                              )}
                              {!isWithdrawn && !isRejected && app.status !== 'Joined' && app.status !== 'Offered' && (
                                <button
                                  type="button"
                                  onClick={() => handleWithdrawApplication(app.id)}
                                  className={styles.btnSecondary}
                                  style={{ color: '#DC2626', borderColor: '#FECACA', fontSize: '0.78rem' }}
                                  title="Withdraw this application"
                                >
                                  ❌ Withdraw
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💼</div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>No Applications Found</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.3rem' }}>
                          Browse open positions on the Scriza Career portal to apply.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {applications.length > 0 && (
              <Pagination 
                currentPage={1}
                totalPages={1}
                onPageChange={() => {}}
                totalItems={applications.length}
                itemsPerPage={10}
                itemLabel="active applications"
              />
            )}
          </div>
        )}

        {/* TAB 4: Interview Status */}
        {activeTab === 'interview_status' && (
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>Interview Status & Schedule</h3>
                <p className={styles.cardSub} style={{ margin: '0.2rem 0 0 0' }}>
                  View upcoming interview slots and feedback from Scriza client technical leads.
                </p>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '1.5rem', borderRadius: '12px', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                    <span style={{
                      background: confirmedAttendance ? '#DCFCE7' : '#FEF3C7',
                      color: confirmedAttendance ? '#166534' : '#92400E',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '0.25rem 0.6rem',
                      borderRadius: '12px'
                    }}>
                      {confirmedAttendance ? '● Attendance Confirmed' : '● Action Required: Confirm Slot'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      Round: Technical System Design
                    </span>
                  </div>

                  <h4 style={{ margin: '0.35rem 0', color: '#0F172A', fontSize: '1.15rem', fontWeight: 800 }}>
                    Technical Interview with CloudScale Inc (USA)
                  </h4>
                  <p style={{ margin: '0.4rem 0', fontSize: '0.9rem', color: '#334155' }}>
                    Scheduled Time: <strong>Tomorrow @ 6:30 PM IST (8:00 AM EST)</strong>
                  </p>
                  <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                    Calendar invite and meeting briefing dispatched to <strong style={{ color: '#0F172A' }}>{displayEmail}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <a
                    href="https://meet.google.com/szn-tech-meet"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: '#0F172A',
                      color: '#ffffff',
                      padding: '0.55rem 1rem',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    📹 Join Google Meet
                  </a>

                  {!confirmedAttendance ? (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmedAttendance(true);
                        showToast('✓ Attendance confirmed! The client hiring team has been notified.');
                      }}
                      className={styles.btnPrimary}
                      style={{ padding: '0.55rem 1rem', fontSize: '0.82rem' }}
                    >
                      ✓ Confirm Attendance
                    </button>
                  ) : (
                    <span style={{ color: '#166534', fontWeight: 800, fontSize: '0.82rem', background: '#DCFCE7', padding: '0.45rem 0.8rem', borderRadius: '6px' }}>
                      ✓ Confirmed
                    </span>
                  )}

                  {!rescheduleRequested ? (
                    <button
                      type="button"
                      onClick={() => {
                        const newSlot = window.prompt('Please enter your preferred date and time to reschedule (e.g. Oct 24, 7:00 PM IST):');
                        if (newSlot) {
                          setRescheduleRequested(true);
                          showToast(`✓ Reschedule request submitted for: ${newSlot}`);
                        }
                      }}
                      className={styles.btnSecondary}
                      style={{ fontSize: '0.82rem' }}
                    >
                      📅 Reschedule
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#D97706', fontWeight: 700 }}>
                      ⏳ Reschedule Requested
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

    </div>
  );
}
