'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/expressApi';
import styles from './DashboardSidebar.module.css';

interface DashboardSidebarProps {
  role: 'admin' | 'client' | 'talent' | 'contributor' | 'candidate';
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  user?: any;
  isCollapsed?: boolean;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  role,
  activeTab,
  onTabChange,
  user,
  isCollapsed = false,
}) => {
  const router = useRouter();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    authApi.logout();
    localStorage.removeItem('scrizians_token');
    localStorage.removeItem('scrizians_user');
    router.push('/dashboard');
  };

  const handleLogoutAll = () => {
    authApi.logoutAll();
    localStorage.removeItem('scrizians_token');
    localStorage.removeItem('scrizians_user');
    router.push('/dashboard');
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'admin': return 'Admin & Staff Ops';
      case 'client': return 'Client / Company';
      case 'talent': return 'Scrizian Talent';
      case 'contributor': return 'Content Author';
      case 'candidate': return 'Job Candidate';
      default: return 'Dashboard';
    }
  };

  const handleItemClick = (tab: string) => {
    setIsMobileSidebarOpen(false);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <>
      {/* Mobile Top Header Bar */}
      <div className={styles.mobileBar}>
        <div className={styles.mobileBrand}>
          <img src="/images/logo-white.png" alt="Scrizians Logo" className={styles.mobileLogo} />
          <span className={styles.mobilePortalName}>{getRoleLabel()}</span>
        </div>
        <button 
          type="button"
          className={styles.mobileToggleBtn}
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          aria-label="Toggle Dashboard Menu"
        >
          <span>{isMobileSidebarOpen ? '✕' : '☰'}</span>
          <span style={{ fontSize: '0.8rem' }}>Menu</span>
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      <div 
        className={`${styles.mobileBackdrop} ${isMobileSidebarOpen ? styles.mobileBackdropShow : ''}`}
        onClick={() => setIsMobileSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar Drawer Container */}
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ''} ${isMobileSidebarOpen ? styles.sidebarOpen : ''}`}>
        {/* Top Logo */}
        <div className={styles.logoBox}>
          <Link href="/" className={styles.brandLink}>
            <img src="/images/logo-white.png" alt="Scrizians Logo" className={styles.brandImg} />
          </Link>
        </div>

        {/* User Snippet for non-admin */}
        {role !== 'admin' && (
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              {user?.scrizianId ? user.scrizianId.slice(-2) : (user?.name?.charAt(0) || 'U')}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user?.name || 'Scrizians User'}</div>
              <div className={styles.userSub}>
                {user?.scrizianId ? (
                  <span className={styles.scrizianIdTag}>{user.scrizianId}</span>
                ) : (
                  user?.email || 'verified@scrizians.com'
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className={styles.navMenu} aria-label="Dashboard Menu">
          {/* 1. Admin & Scriza Staff Panel */}
          {role === 'admin' && (
            <>
              <a
                href="#dashboard"
                className={`${styles.navItem} ${activeTab === 'dashboard' || !activeTab ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('dashboard'); }}
                title="Dashboard Overview"
              >
                <span className={styles.itemIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
                </span>
                <span className={styles.navItemText}>Dashboard</span>
              </a>

              <a
                href="#leads"
                className={`${styles.navItem} ${activeTab === 'leads' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('leads'); }}
                title="Assigned Leads & CRM"
              >
                <span className={styles.itemIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </span>
              </a>

              <a
                href="#requirements"
                className={`${styles.navItem} ${activeTab === 'requirements' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('requirements'); }}
                title="Client Requirements Review"
              >
                <span className={styles.itemIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </span>
                <span className={styles.navItemText}>Client Requirements</span>
              </a>

              <a
                href="#talent"
                className={`${styles.navItem} ${activeTab === 'talent' || activeTab === 'employees' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('talent'); }}
                title="Talent Review & Roster"
              >
                <span className={styles.itemIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </span>
                <span className={styles.navItemText}>Talent Review & Roster</span>
              </a>

              <a
                href="#jobs"
                className={`${styles.navItem} ${activeTab === 'jobs' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('jobs'); }}
                title="Job Workflows"
              >
                <span className={styles.itemIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                </span>
                <span className={styles.navItemText}>Job Workflows</span>
              </a>

              <a
                href="#insights"
                className={`${styles.navItem} ${activeTab === 'insights' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('insights'); }}
                title="Content & Insights"
              >
                <span className={styles.itemIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                </span>
                <span className={styles.navItemText}>Content & Insights</span>
              </a>

              <a
                href="#portfolio"
                className={`${styles.navItem} ${activeTab === 'portfolio' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('portfolio'); }}
                title="Portfolio Showcase"
              >
                <span className={styles.itemIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m14.31 8 5.74 9.94"/><path d="M9.69 8h11.48"/><path d="m7.38 12 5.74-9.94"/><path d="M9.69 16 3.95 6.06"/><path d="M14.31 16H2.83"/><path d="m16.62 12-5.74 9.94"/></svg>
                </span>
                <span className={styles.navItemText}>Portfolio Showcase</span>
              </a>

              <a
                href="#case-studies"
                className={`${styles.navItem} ${activeTab === 'case-studies' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('case-studies'); }}
                title="Case Studies CMS"
              >
                <span className={styles.itemIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                </span>
                <span className={styles.navItemText}>Case Studies CMS</span>
              </a>

              <a
                href="#config"
                className={`${styles.navItem} ${activeTab === 'config' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('config'); }}
                title="Platform Config & RBAC"
              >
                <span className={styles.itemIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </span>
                <span className={styles.navItemText}>Platform Config & RBAC</span>
              </a>

              <a
                href="#audit"
                className={`${styles.navItem} ${activeTab === 'audit' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('audit'); }}
                title="SEO, Pricing & Audit"
              >
                <span className={styles.itemIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </span>
                <span className={styles.navItemText}>SEO, Pricing & Audit</span>
              </a>
              <a
                href="#profile"
                className={`${styles.navItem} ${activeTab === 'profile' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('profile'); }}
                title="Administrator Profile"
              >
                <span className={styles.itemIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <span className={styles.navItemText}>Administrator Profile</span>
              </a>
            </>
          )}

          {/* 2. Client / Company Panel */}
          {role === 'client' && (
            <>
              <a
                href="#dashboard"
                className={`${styles.navItem} ${activeTab === 'dashboard' || (!activeTab && activeTab !== 'profile') ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('dashboard'); }}
                title="Client Dashboard Overview"
              >
                <span className={styles.itemIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
                </span>
                <span className={styles.navItemText}>Dashboard</span>
              </a>
              <a
                href="#requirements"
                className={`${styles.navItem} ${activeTab === 'requirements' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('requirements'); }}
              >
                <span className={styles.itemIcon}>📌</span>
                <span className={styles.navItemText}>Hiring Requirements</span>
              </a>
              <a
                href="#shortlist"
                className={`${styles.navItem} ${activeTab === 'shortlist' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('shortlist'); }}
              >
                <span className={styles.itemIcon}>⭐</span>
                <span>Shortlisted Talent</span>
              </a>
              <a
                href="#interviews"
                className={`${styles.navItem} ${activeTab === 'interviews' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('interviews'); }}
              >
                <span className={styles.itemIcon}>📅</span>
                <span>Interview Schedule</span>
              </a>
              <a
                href="#engagements"
                className={`${styles.navItem} ${activeTab === 'engagements' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('engagements'); }}
              >
                <span className={styles.itemIcon}>🤝</span>
                <span>Active Engagements</span>
              </a>
              <a
                href="#invoices"
                className={`${styles.navItem} ${activeTab === 'invoices' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('invoices'); }}
              >
                <span className={styles.itemIcon}>🧾</span>
                <span>Invoices & Billing</span>
              </a>
              <a
                href="#profile"
                className={`${styles.navItem} ${activeTab === 'profile' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('profile'); }}
                title="Company & Client Profile"
              >
                <span className={styles.itemIcon}>👤</span>
                <span className={styles.navItemText}>Company Profile</span>
              </a>
            </>
          )}

          {/* 3. Scrizian / Talent Panel */}
          {role === 'talent' && (
            <>
              <a
                href="#dashboard"
                className={`${styles.navItem} ${activeTab === 'dashboard' || (!activeTab && activeTab !== 'profile') ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('dashboard'); }}
                title="Specialist Dashboard Overview"
              >
                <span className={styles.itemIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
                </span>
                <span className={styles.navItemText}>Dashboard</span>
              </a>
              <a
                href="#portfolio"
                className={`${styles.navItem} ${activeTab === 'portfolio' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('portfolio'); }}
              >
                <span className={styles.itemIcon}>🎨</span>
                <span>Portfolio Showcase</span>
              </a>
              <a
                href="#availability"
                className={`${styles.navItem} ${activeTab === 'availability' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('availability'); }}
              >
                <span className={styles.itemIcon}>🟢</span>
                <span>Availability & Rates</span>
              </a>
              <a
                href="#opportunities"
                className={`${styles.navItem} ${activeTab === 'opportunities' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('opportunities'); }}
              >
                <span className={styles.itemIcon}>🎯</span>
                <span>Opportunities</span>
              </a>
              <a
                href="#jobs"
                className={`${styles.navItem} ${activeTab === 'jobs' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('jobs'); }}
              >
                <span className={styles.itemIcon}>💼</span>
                <span>Jobs Board</span>
              </a>
              <a
                href="#articles"
                className={`${styles.navItem} ${activeTab === 'articles' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('articles'); }}
              >
                <span className={styles.itemIcon}>📝</span>
                <span>My Articles</span>
              </a>
              <a
                href="#analytics"
                className={`${styles.navItem} ${activeTab === 'analytics' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('analytics'); }}
              >
                <span className={styles.itemIcon}>📊</span>
                <span>Performance Analytics</span>
              </a>
              <a
                href="#profile"
                className={`${styles.navItem} ${activeTab === 'profile' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('profile'); }}
              >
                <span className={styles.itemIcon}>👤</span>
                <span>Scrizian Profile</span>
              </a>
            </>
          )}

          {/* 4. Contributor / Author Panel */}
          {role === 'contributor' && (
            <>
              <a
                href="#dashboard"
                className={`${styles.navItem} ${activeTab === 'dashboard' || (!activeTab && activeTab !== 'profile') ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('dashboard'); }}
                title="Contributor Dashboard Overview"
              >
                <span className={styles.itemIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
                </span>
                <span className={styles.navItemText}>Dashboard</span>
              </a>
              <a
                href="#submissions"
                className={`${styles.navItem} ${activeTab === 'submissions' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('submissions'); }}
              >
                <span className={styles.itemIcon}>📝</span>
                <span>Drafts & Submissions</span>
              </a>
              <a
                href="#comments"
                className={`${styles.navItem} ${activeTab === 'comments' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('comments'); }}
              >
                <span className={styles.itemIcon}>💬</span>
                <span>Review Comments</span>
              </a>
              <a
                href="#analytics"
                className={`${styles.navItem} ${activeTab === 'analytics' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('analytics'); }}
              >
                <span className={styles.itemIcon}>📊</span>
                <span>Content Analytics</span>
              </a>
              <a
                href="#profile"
                className={`${styles.navItem} ${activeTab === 'profile' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('profile'); }}
              >
                <span className={styles.itemIcon}>👤</span>
                <span>Author Profile</span>
              </a>
            </>
          )}

          {/* 5. Candidate Panel */}
          {role === 'candidate' && (
            <>
              <a
                href="#dashboard"
                className={`${styles.navItem} ${activeTab === 'dashboard' || (!activeTab && activeTab !== 'profile') ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('dashboard'); }}
                title="Candidate Dashboard Overview"
              >
                <span className={styles.itemIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
                </span>
                <span className={styles.navItemText}>Dashboard</span>
              </a>
              <a
                href="#resume"
                className={`${styles.navItem} ${activeTab === 'resume' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('resume'); }}
              >
                <span className={styles.itemIcon}>📄</span>
                <span>Resume & Credentials</span>
              </a>
              <a
                href="#applications"
                className={`${styles.navItem} ${activeTab === 'applications' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('applications'); }}
              >
                <span className={styles.itemIcon}>💼</span>
                <span>Job Applications</span>
              </a>
              <a
                href="#interview_status"
                className={`${styles.navItem} ${activeTab === 'interview_status' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('interview_status'); }}
              >
                <span className={styles.itemIcon}>📅</span>
                <span>Interview Status</span>
              </a>
              <a
                href="#profile"
                className={`${styles.navItem} ${activeTab === 'profile' ? styles.navItemActive : ''}`}
                onClick={(e) => { e.preventDefault(); handleItemClick('profile'); }}
              >
                <span className={styles.itemIcon}>👤</span>
                <span>My Profile</span>
              </a>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.btnWebsite}>
            🌐 Back to Website
          </Link>
        </div>
      </aside>
    </>
  );
};
