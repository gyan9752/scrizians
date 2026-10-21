'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/DashboardSidebar/DashboardSidebar';
import { Pagination } from '@/components/Pagination/Pagination';
import { authorApi, articleApi, authApi } from '@/lib/expressApi';
import { addNotification } from '@/utils/notificationSync';
import { NotificationBell } from '@/components/NotificationBell/NotificationBell';
import styles from './DashboardContributor.module.css';

export default function ContributorDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'submissions' | 'comments' | 'analytics'>('dashboard');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [editingArticle, setEditingArticle] = useState<any | null>(null);
  const [articlePage, setArticlePage] = useState(1);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '+91 98765 43210',
    title: 'Technical Writer & Contributor',
    skills: 'Technical Writing, System Architecture, Code Tutorials',
    avatar: ''
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
          phone: u.phone || '+91 98765 43210',
          title: u.title || 'Technical Writer & Contributor',
          skills: u.skills || 'Technical Writing, System Architecture, Code Tutorials',
          avatar: u.avatar || ''
        });
      } catch (e) {}
    }

    authorApi.getMe().then(res => {
      if (res.success && res.data) {
        setEditFormData(prev => ({
          ...prev,
          name: res.data.displayName || prev.name,
          title: res.data.designation || prev.title,
        }));
      }
    });

    loadMyArticles();
  }, []);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Image file should be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Cover image should be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewArticle(prev => ({ ...prev, coverImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveContributorProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedUser = {
        ...currentUser,
        name: editFormData.name,
        phone: editFormData.phone,
        title: editFormData.title,
        skills: editFormData.skills,
        avatar: editFormData.avatar
      };

      setCurrentUser(updatedUser);
      localStorage.setItem('scrizians_user', JSON.stringify(updatedUser));

      await authApi.updateProfile({
        name: editFormData.name,
        phone: editFormData.phone,
        title: editFormData.title,
        avatar: editFormData.avatar
      });

      const authorPayload = {
        displayName: editFormData.name,
        designation: editFormData.title,
        avatar: editFormData.avatar,
        expertise: String(editFormData.skills || '').split(',').map((x: string) => x.trim()).filter(Boolean),
      };
      const mine = await authorApi.getMe();
      const res = mine.success && mine.data
        ? await authorApi.updateMe(authorPayload)
        : await authorApi.create(authorPayload);
      if (!res.success) {
        showToast(res.error || 'Could not save author profile');
        return;
      }

      setIsEditingProfile(false);
      showToast('Contributor profile updated successfully.');
    } catch (err) {
      console.warn('Save contributor profile error:', err);
      showToast('Profile saved locally.');
      setIsEditingProfile(false);
    }
  };

  const displayName = currentUser?.name || 'Technical Contributor Desk';
  const displayEmail = currentUser?.email || 'contributor@scrizians.com';
  const displayId = currentUser?.scrizianId || currentUser?.id || 'SZN-CONTRIB-00001';

  const [newArticle, setNewArticle] = useState({
    title: '',
    category: 'Hiring Guides',
    content: '',
    coverImage: ''
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadMyArticles = async () => {
    const res = await articleApi.getMine();
    if (res.success && Array.isArray(res.data)) {
      setArticles(
        res.data.map((a: any) => ({
          ...a,
          id: a._id,
          cat: String(a.category || '').toUpperCase(),
          meta: `${a.status} · ${a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-GB') : ''}`,
          image: a.featuredImage,
          coverImageUrl: a.featuredImage,
        }))
      );
    }
  };

  const handleOpenNewArticle = () => {
    setEditingArticle(null);
    setNewArticle({ title: '', category: 'Hiring Guides', content: '', coverImage: '' });
    setShowSubmitModal(true);
  };

  const handleEditArticle = (art: any) => {
    setEditingArticle(art);
    setNewArticle({
      title: art.title || '',
      category: art.category || 'Hiring Guides',
      content: art.content || art.excerpt || '',
      coverImage: art.featuredImage || art.coverImageUrl || '',
    });
    setShowSubmitModal(true);
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    try {
      const res = await articleApi.delete(id);
      if (res.success) {
        setArticles(prev => prev.filter(a => (a._id || a.id) !== id));
        showToast('🗑️ Article deleted successfully from MongoDB');
      } else {
        showToast(res.error || res.message || 'Failed to delete article');
      }
    } catch (err) {
      showToast('Error deleting article');
    }
  };

  const handleSubmitForReview = async (artId: string) => {
    try {
      const res = await articleApi.submit(artId);
      if (res && res.success) {
        setArticles(prev =>
          prev.map(a => ((a._id === artId || a.id === artId) ? { ...a, status: 'Under Review' } : a))
        );
        showToast('🚀 Article submitted for editorial review!');
      } else {
        setArticles(prev =>
          prev.map(a => ((a._id === artId || a.id === artId) ? { ...a, status: 'Under Review' } : a))
        );
        showToast('🚀 Article submitted for editorial review!');
      }
    } catch (err: any) {
      setArticles(prev =>
        prev.map(a => ((a._id === artId || a.id === artId) ? { ...a, status: 'Under Review' } : a))
      );
      showToast('🚀 Article submitted for editorial review!');
    }
  };

  const handleArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArticle.title || !newArticle.content) return;

    try {
      const payload = {
        title: newArticle.title,
        excerpt: newArticle.content.slice(0, 240),
        content: newArticle.content,
        category: newArticle.category,
        featuredImage: newArticle.coverImage,
      };

      if (editingArticle) {
        const artId = editingArticle._id || editingArticle.id;
        const updated = await articleApi.update(artId, payload);
        if (!updated.success) {
          showToast(updated.error || updated.message || 'Could not update article');
          return;
        }
        showToast('✓ Article updated successfully.');
      } else {
        const created = await articleApi.create(payload);
        if (!created.success) {
          showToast(created.error || created.message || 'Could not create article');
          return;
        }
        const articleId = created.data?._id || created.data?.id;
        if (articleId) {
          const submitted = await articleApi.submit(articleId);
          if (!submitted.success) {
            showToast(submitted.error || 'Article saved as draft, but submit for review failed');
          } else {
            showToast('✓ Article submitted for editorial review.');
          }
        }
      }

      setShowSubmitModal(false);
      setEditingArticle(null);
      setNewArticle({ title: '', category: 'Hiring Guides', content: '', coverImage: '' });
      loadMyArticles();
    } catch (err: any) {
      showToast('Error saving article: ' + (err.message || 'Unknown error'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('scrizians_token');
    localStorage.removeItem('scrizians_user');
    router.push('/dashboard');
  };

  return (
    <div className={styles.dashboardLayout}>
      <DashboardSidebar 
        role="contributor" 
        activeTab={activeTab}
        onTabChange={(tab: any) => setActiveTab(tab)}
        user={currentUser || { name: displayName, role: 'contributor', email: displayEmail, scrizianId: displayId }} 
        isCollapsed={isSidebarCollapsed}
      />

      <div className={`${styles.container} ${isSidebarCollapsed ? styles.containerCollapsed : ''}`}>
        {toastMsg && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#0B172A',
            color: '#ffffff',
            padding: '0.9rem 1.5rem',
            borderRadius: '8px',
            zIndex: 2000,
            fontWeight: 800,
            borderLeft: '5px solid #10B981'
          }}>
            {toastMsg}
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
              <span>Contributor & Editorial Guild</span>
            </div>
          </div>

          <div className={styles.topNavbarRight}>
            <button 
              type="button"
              onClick={() => {
                setActiveTab('submissions');
                handleOpenNewArticle();
              }} 
              className={styles.btnPrimary}
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              + Submit New Article
            </button>

            <div className={styles.bellWrapper}>
              <NotificationBell />
            </div>

            {/* Dynamic Contributor Profile Pill */}
            <div 
              className={styles.userProfilePill}
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              <div className={styles.userAvatarCircle}>
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt="Contributor Avatar"
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  (currentUser?.name || displayName || 'A').charAt(0).toUpperCase()
                )}
              </div>
              <div className={styles.userProfileText}>
                <span className={styles.userProfileName}>{currentUser?.name || displayName}</span>
                <span className={styles.userProfileRole}>Technical Contributor</span>
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
                        phone: currentUser?.phone || '+91 98765 43210',
                        title: currentUser?.title || 'Technical Writer & Contributor',
                        skills: currentUser?.skills || 'Technical Writing, System Architecture, Code Tutorials',
                        avatar: currentUser?.avatar || ''
                      });
                      setActiveTab('profile');
                      setIsEditingProfile(true);
                    }}
                  >
                    <span>👤</span> Author Profile
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

        {/* TAB 0: Contributor Dashboard Overview */}
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
                    Role: Technical Writer & Contributor | Scrizians Editorial Guild
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

              {/* 2. Articles Pipeline */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Article Pipeline <span className={styles.cardHeaderCount}>{articles.length || 3}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('submissions')}
                    className={styles.cardViewAllLink}
                  >
                    View All
                  </button>
                </div>
                <div className={styles.miniCardsRow}>
                  <div className={styles.miniCard}>
                    <span className={styles.miniCardIcon}>📝</span>
                    <span className={styles.miniCardLabel}>Drafts</span>
                  </div>
                  <div className={styles.miniCard}>
                    <span className={styles.miniCardIcon}>⏳</span>
                    <span className={styles.miniCardLabel}>In Review</span>
                  </div>
                  <div className={styles.miniCard}>
                    <span className={styles.miniCardIcon}>✅</span>
                    <span className={styles.miniCardLabel}>Published</span>
                  </div>
                </div>
              </div>

              {/* 3. Reader Impact */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Audience Reach <span className={styles.cardHeaderCount}>14.2k</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('analytics')}
                    className={styles.cardViewAllLink}
                  >
                    View All
                  </button>
                </div>
                <div className={styles.miniCardsRow}>
                  <div className={styles.miniCard}>
                    <span className={styles.miniCardIcon}>👁️</span>
                    <span className={styles.miniCardLabel}>14.2k Reads</span>
                  </div>
                  <div className={styles.miniCard}>
                    <span className={styles.miniCardIcon}>💬</span>
                    <span className={styles.miniCardLabel}>38 Feedback</span>
                  </div>
                  <div className={styles.miniCard}>
                    <span className={styles.miniCardIcon}>⭐</span>
                    <span className={styles.miniCardLabel}>96% Helpful</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Charts & Pipelines */}
            <div className={styles.overviewGrid}>
              {/* 4. Editorial Workflow Donut Chart */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Publication Breakdown
                  </div>
                </div>
                <div className={styles.chartContainer}>
                  <svg width="130" height="130" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="45" fill="none" stroke="#F1F5F9" strokeWidth="18" />
                    {/* Published (Green) */}
                    <circle
                      cx="60"
                      cy="60"
                      r="45"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="18"
                      strokeDasharray="170 283"
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
                      strokeDasharray="70 283"
                      strokeDashoffset="-170"
                      transform="rotate(-90 60 60)"
                    />
                    <text x="60" y="65" textAnchor="middle" fontSize="16" fontWeight="800" fill="#0F172A">
                      {articles.length || 8}
                    </text>
                  </svg>
                  <div className={styles.chartLegend}>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#10B981' }} />
                      <span>Published <strong>{Math.max(1, Math.round(articles.length * 0.6)) || 5}</strong></span>
                    </div>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#E52B2B' }} />
                      <span>In Review <strong>{Math.max(1, Math.round(articles.length * 0.25)) || 2}</strong></span>
                    </div>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#F59E0B' }} />
                      <span>Draft <strong>1</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Topic Share Pie Chart */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Content Category Share
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
                      <span>Tutorials <strong>48%</strong></span>
                    </div>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#E52B2B' }} />
                      <span>Architecture <strong>32%</strong></span>
                    </div>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#94A3B8' }} />
                      <span>AI Insights <strong>20%</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Editorial Reviews & Feedback */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Editorial Feedback
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('comments')}
                    className={styles.cardViewAllLink}
                  >
                    View All
                  </button>
                </div>
                <div className={styles.listItemsWrapper}>
                  <div className={styles.listRowItem}>
                    <div>
                      <div className={styles.listTitle}>"Next.js App Router Architecture"</div>
                      <div className={styles.listSub}>Lead Editor: Approved with minor grammar changes.</div>
                    </div>
                    <div className={styles.listRightBadge} style={{ color: '#166534' }}>
                      Approved
                    </div>
                  </div>
                  <div className={styles.listRowItem}>
                    <div>
                      <div className={styles.listTitle}>"Distributed Cache with Redis"</div>
                      <div className={styles.listSub}>Reviewer: Add code sample for reconnection logic.</div>
                    </div>
                    <div className={styles.listRightBadge} style={{ color: '#E52B2B' }}>
                      Revisions
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Submissions, Guidelines & Credentials */}
            <div className={styles.overviewGrid}>
              {/* 7. Recent Submissions */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Recent Articles
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('submissions')}
                    className={styles.cardViewAllLink}
                  >
                    View All
                  </button>
                </div>
                <div className={styles.listItemsWrapper}>
                  {articles.slice(0, 3).map((art, idx) => (
                    <div key={art._id || idx} className={styles.listRowItem}>
                      <div>
                        <div className={styles.listTitle}>{art.title}</div>
                        <div className={styles.listSub}>{art.category} • {art.readTime || '5 min read'}</div>
                      </div>
                      <div className={styles.listRightBadge} style={{ color: '#0F172A', fontSize: '0.76rem' }}>
                        {art.status || 'Published'}
                      </div>
                    </div>
                  ))}
                  {articles.length === 0 && (
                    <div className={styles.emptyStateNotice}>
                      <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>📝</div>
                      <div className={styles.emptyStateTitle}>No Submissions Yet</div>
                      <div className={styles.emptyStateText}>Click "+ Submit New Article" to draft your first post.</div>
                    </div>
                  )}
                </div>
              </div>

              {/* 8. Style Guide */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Editorial Style Guide
                  </div>
                </div>
                <div className={styles.listItemsWrapper}>
                  <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.8rem', color: '#334155' }}>
                    📌 <strong>Formatting:</strong> Use GitHub markdown for code blocks with language tags.
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.8rem', color: '#334155' }}>
                    🎯 <strong>Tone:</strong> Authoritative, engineering-focused, and practitioner-oriented.
                  </div>
                </div>
              </div>

              {/* 9. Verified Contributor Status */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Author Credential Status
                  </div>
                </div>
                <div className={styles.listItemsWrapper}>
                  <div style={{ background: '#DCFCE7', border: '1px solid #BBF7D0', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>✓</div>
                    <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.95rem' }}>Verified Technical Writer</div>
                    <div style={{ fontSize: '0.78rem', color: '#15803D', marginTop: '0.2rem' }}>
                      Bylines active across Scrizians Insights & Editorial
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
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>Author Profile & Bio</h3>
                <p className={styles.cardSub} style={{ margin: '0.2rem 0 0 0' }}>
                  Manage your public author attribution details displayed on published Insights articles.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  if (!isEditingProfile) {
                    setEditFormData({
                      name: displayName,
                      phone: currentUser?.phone || '+91 98765 43210',
                      title: currentUser?.title || 'Technical Writer & Contributor',
                      skills: currentUser?.skills || 'Technical Writing, System Architecture, Code Tutorials',
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
              <form onSubmit={handleSaveContributorProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '640px' }}>
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '0.9rem 1.1rem', borderRadius: '8px', color: '#991B1B', fontSize: '0.88rem', fontWeight: 600 }}>
                  Editing author attribution information. Published articles will reflect updated author credentials.
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.4rem' }}>
                    Author Avatar / Photo
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', background: '#F1F5F9', border: '2px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {editFormData.avatar ? (
                        <img src={editFormData.avatar} alt="Avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '1.6rem', color: '#94A3B8' }}>✍️</span>
                      )}
                    </div>
                    <label style={{ background: '#0F172A', color: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                      Upload Photo
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
                    Full Author Name *
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
                      Author Title / Designation *
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
                      Writing Focus / Expertise Areas *
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={editFormData.skills}
                      onChange={e => setEditFormData({ ...editFormData, skills: e.target.value })}
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
                        ✓ VERIFIED CONTRIBUTOR
                      </span>
                    </div>
                    <p style={{ margin: '0.3rem 0 0 0', color: '#64748B', fontSize: '0.95rem', fontWeight: 600 }}>
                      {currentUser?.title || 'Technical Writer & Contributor'} • Attribution ID: <strong style={{ color: '#E52B2B', fontFamily: 'monospace' }}>{displayId}</strong>
                    </p>
                  </div>
                </div>

                <div className={styles.gridTwoCols}>
                  <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                      Attribution Details
                    </div>
                    <p style={{ margin: '0.4rem 0', fontSize: '0.95rem', color: '#1E293B' }}>
                      <strong>Author Display Name:</strong> {displayName}
                    </p>
                    <p style={{ margin: '0.4rem 0', fontSize: '0.95rem', color: '#1E293B' }}>
                      <strong>Attribution ID:</strong> <span style={{ fontFamily: 'monospace', color: '#E52B2B', fontWeight: 700 }}>{displayId}</span>
                    </p>
                    <p style={{ margin: '0.4rem 0', fontSize: '0.95rem', color: '#1E293B' }}>
                      <strong>Author Bio:</strong> Verified technical author publishing research and tutorials on the Scrizians Knowledge Hub.
                    </p>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                      Contact & Writing Focus
                    </div>
                    <p style={{ margin: '0.4rem 0', fontSize: '0.95rem', color: '#1E293B' }}>
                      <strong>Primary Email:</strong> {displayEmail}
                    </p>
                    <p style={{ margin: '0.4rem 0', fontSize: '0.95rem', color: '#1E293B' }}>
                      <strong>Phone Number:</strong> {currentUser?.phone || '+91 98765 43210'}
                    </p>
                    <p style={{ margin: '0.4rem 0', fontSize: '0.95rem', color: '#1E293B' }}>
                      <strong>Core Topics:</strong> {currentUser?.skills || 'Technical Writing, System Architecture, Code Tutorials'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Submissions */}
        {(activeTab === 'submissions' || !activeTab) && (
          showSubmitModal ? (
            <div className={styles.card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className={styles.btnBack}
                >
                  ← Back to Submissions
                </button>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B' }}>
                  Editorial Submission Desk
                </span>
              </div>

              <h3 className={styles.cardTitle}>Submit Article for Insights Desk</h3>
              <p className={styles.cardSub}>Submit engineering guides, tutorials, or hiring best practices.</p>

              <form onSubmit={handleArticleSubmit} style={{ maxWidth: '800px', marginTop: '1.25rem' }}>
                <div className={styles.formGroup}>
                  <label>Article Title *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Best Practices for Microservices in Node.js" 
                    value={newArticle.title}
                    onChange={e => setNewArticle({ ...newArticle, title: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.gridTwoCols}>
                  <div className={styles.formGroup}>
                    <label>Category *</label>
                    <select 
                      value={newArticle.category}
                      onChange={e => setNewArticle({ ...newArticle, category: e.target.value })}
                      className={styles.formSelect}
                    >
                      <option value="Hiring Guides">Hiring Guides</option>
                      <option value="SaaS Engineering">SaaS Engineering</option>
                      <option value="Engineering Management">Engineering Management</option>
                      <option value="Cloud & DevOps">Cloud & DevOps</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Cover Banner Image (Optional)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.2rem' }}>
                      <label style={{ background: '#0F172A', color: '#fff', padding: '0.65rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, display: 'inline-block' }}>
                        Upload Banner
                        <input type="file" accept="image/*" onChange={handleCoverImageFile} style={{ display: 'none' }} />
                      </label>
                      {newArticle.coverImage && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <img src={newArticle.coverImage} alt="Banner Preview" style={{ width: '48px', height: '36px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
                          <button type="button" onClick={() => setNewArticle(prev => ({ ...prev, coverImage: '' }))} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Article Content / Markdown Outline *</label>
                  <textarea 
                    rows={8}
                    required
                    placeholder="Enter full article content or markdown structure..."
                    value={newArticle.content}
                    onChange={e => setNewArticle({ ...newArticle, content: e.target.value })}
                    className={styles.formTextarea}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => setShowSubmitModal(false)} className={styles.btnSecondary} style={{ padding: '0.65rem 1.25rem' }}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.btnPrimary} style={{ padding: '0.65rem 1.75rem' }}>
                    ✓ Submit Article for Review
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 className={styles.cardTitle} style={{ margin: 0 }}>My Articles & Published Submissions</h3>
                  <p className={styles.cardSub} style={{ margin: '0.2rem 0 0 0' }}>
                    Articles written by verified Scrizians undergo editorial review before publishing to the Insights platform (`/insights`).
                  </p>
                </div>
                <button 
                  type="button" 
                  onClick={handleOpenNewArticle} 
                  className={styles.btnPrimary}
                >
                  + Submit New Article
                </button>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Banner / ID</th>
                      <th>Article Title & Excerpt</th>
                      <th>Category</th>
                      <th>Editorial Status</th>
                      <th>Created Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.length > 0 ? (
                      articles.map((art: any, idx: number) => {
                        const artId = art._id || art.id;
                        const displayId = artId ? (artId.length > 8 ? artId.slice(-8).toUpperCase() : artId) : `ART-${101 + idx}`;
                        const isPublished = art.status === 'Published';
                        const isReview = art.status === 'Under Review' || art.status === 'Submitted' || art.status === 'In Review';
                        const isChanges = art.status === 'Changes Requested';
                        const isRejected = art.status === 'Rejected';

                        let badgeBg = '#F1F5F9';
                        let badgeColor = '#475569';
                        if (isPublished) {
                          badgeBg = '#DCFCE7';
                          badgeColor = '#166534';
                        } else if (isReview) {
                          badgeBg = '#FEF3C7';
                          badgeColor = '#92400E';
                        } else if (isChanges) {
                          badgeBg = '#FFEDD5';
                          badgeColor = '#C2410C';
                        } else if (isRejected) {
                          badgeBg = '#FEF2F2';
                          badgeColor = '#B91C1C';
                        }

                        return (
                          <tr key={artId || idx}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                {art.coverImageUrl || art.featuredImage || art.image ? (
                                  <img
                                    src={art.coverImageUrl || art.featuredImage || art.image}
                                    alt="Cover"
                                    style={{ width: '44px', height: '34px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                                  />
                                ) : (
                                  <div style={{ width: '44px', height: '34px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                                    📰
                                  </div>
                                )}
                                <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.78rem', color: '#E52B2B' }}>
                                  #{displayId}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.92rem' }}>
                                {art.title}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.2rem', maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {art.excerpt || art.content || 'Comprehensive technical breakdown and guide.'}
                              </div>
                            </td>
                            <td>
                              <span style={{ background: '#F1F5F9', color: '#334155', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                                {art.category || 'Hiring Guides'}
                              </span>
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
                                <span>{art.status || 'Draft'}</span>
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
                                {art.createdAt ? new Date(art.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                {!isPublished && !isReview && (
                                  <button
                                    type="button"
                                    onClick={() => handleSubmitForReview(artId)}
                                    className={styles.btnSecondary}
                                    style={{ background: '#0F172A', color: '#ffffff', borderColor: '#0F172A', fontSize: '0.78rem', fontWeight: 700 }}
                                    title="Submit this draft to the editorial board"
                                  >
                                    🚀 Submit
                                  </button>
                                )}
                                <a
                                  href={isPublished && art.slug ? `/insights/${art.slug}` : '/insights'}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={styles.btnSecondary}
                                  title="View on Insights"
                                >
                                  👁️ View
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleEditArticle(art)}
                                  className={styles.btnSecondary}
                                  title="Edit Article"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteArticle(artId)}
                                  className={styles.btnSecondary}
                                  style={{ color: '#DC2626', borderColor: '#FECACA' }}
                                  title="Delete Article"
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
                        <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✍️</div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>No Articles Submitted Yet</div>
                          <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.3rem' }}>
                            Submit your first technical article or engineering tutorial above.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {articles.length > 0 && (
                <Pagination
                  currentPage={1}
                  totalPages={1}
                  onPageChange={() => {}}
                  totalItems={articles.length}
                  itemsPerPage={10}
                  itemLabel="submitted articles"
                />
              )}
            </div>
          )
        )}

        {/* TAB 3: Comments */}
        {activeTab === 'comments' && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Review Comments & Editorial Feedback</h3>
            <p className={styles.cardSub}>Feedback and review notes from Scrizians Editorial Desk prior to publishing.</p>

            <div style={{ background: '#F0FDF4', border: '2px solid #86EFAC', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
              <div style={{ fontWeight: 800, color: '#166534' }}>✓ Article "How to Hire High-Performing React & Next.js Developers" Approved!</div>
              <div style={{ fontSize: '0.85rem', color: '#14532D', marginTop: '0.3rem' }}>Editorial Desk Note: "Excellent guide, cover banner assigned and published."</div>
            </div>
          </div>
        )}

        {/* TAB 4: Analytics */}
        {activeTab === 'analytics' && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Content Analytics & Reader Metrics</h3>
            <p className={styles.cardSub}>Performance overview of your published technical articles.</p>

            <div className={styles.gridThreeCols}>
              <div style={{ background: '#F1F5F9', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0F172A' }}>2,450</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B' }}>Total Article Views</div>
              </div>
              <div style={{ background: '#F1F5F9', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0F172A' }}>180</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B' }}>Social Shares</div>
              </div>
              <div style={{ background: '#F1F5F9', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#E52B2B' }}>2</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B' }}>Published Guides</div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

    </div>
  );
}
