'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pagination } from '@/components/Pagination/Pagination';
import { DashboardSidebar } from '@/components/DashboardSidebar/DashboardSidebar';
import { NotificationBell } from '@/components/NotificationBell/NotificationBell';
import { getStoredData, saveStoredData, deleteStoredData, syncAllFromMongoDB, initialLeadsList, initialTalentList, initialJobsList, initialArticlesList } from '@/utils/dataSync';
import { leadApi, talentApi, jobApi, articleApi, portfolioApi, adminApi, caseStudyApi, pricingApi, authApi } from '@/lib/expressApi';
import { adaptLead, adaptTalent, adaptJob, adaptArticle, adaptPortfolio } from '@/lib/adapters';
import styles from './DashboardAdmin.module.css';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [dashboardTableTab, setDashboardTableTab] = useState<'leads' | 'talent' | 'both'>('leads');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Live Admin Stats State
  const [adminStats, setAdminStats] = useState<any>(null);

  // Pagination states
  const [leadsPage, setLeadsPage] = useState(1);
  const [talentPage, setTalentPage] = useState(1);
  const [jobsPage, setJobsPage] = useState(1);
  const [insightsPage, setInsightsPage] = useState(1);
  const [portfolioPage, setPortfolioPage] = useState(1);
  const [caseStudiesPage, setCaseStudiesPage] = useState(1);

  // 1. Leads State
  const [leads, setLeads] = useState<any[]>([]);

  // 2. Talent Profiles State with Avatars
  const [talents, setTalents] = useState<any[]>([]);

  // 3. Jobs State with Company Logos
  const [jobs, setJobs] = useState<any[]>([]);

  // 4. Insights / Articles State with Cover Banners
  const [insights, setInsights] = useState<any[]>([]);

  // 5. Portfolio Showcase State
  const [portfolios, setPortfolios] = useState<any[]>([]);

  // 6. Case Studies CMS State
  const [caseStudies, setCaseStudies] = useState<any[]>([]);

  // 7. Client Requirements Review State
  const [adminRequirements, setAdminRequirements] = useState<any[]>([]);

  // 8. Registered System Users State for RBAC
  const [usersList, setUsersList] = useState<any[]>([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userFormData, setUserFormData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'client',
    avatar: '',
    title: ''
  });

  // Case Study Modal Form State
  const [showCaseStudyModal, setShowCaseStudyModal] = useState(false);
  const [editingCaseStudy, setEditingCaseStudy] = useState<any | null>(null);
  const [caseStudyFormData, setCaseStudyFormData] = useState({
    id: '', title: '', slug: '', category: 'SaaS Development', region: 'United States', challenge: '', solution: '', deliveryTime: '12 wks', status: 'Published'
  });

  // Modal Editing & Adding States
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  
  // Talent Modal Form
  const [showTalentModal, setShowTalentModal] = useState(false);
  const [editingTalent, setEditingTalent] = useState<any | null>(null);
  const [talentFormData, setTalentFormData] = useState({ 
    id: '', displayName: '', title: '', hourlyRateUSD: '35', availability: 'Immediate', skills: '', avatarUrl: '/images/logo.png', status: 'Verified' 
  });

  // Job Modal Form
  const [leadViewMode, setLeadViewMode] = useState<'table' | 'kanban'>('table');
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [jobFormData, setJobFormData] = useState({ 
    id: '', title: '', company: 'Scriza Client Partner', companyLogoUrl: '/images/logo.png', location: 'Remote (India / Global)', rate: '$30 - $40 / hr', status: 'Active' 
  });

  // Insight Modal Form
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [editingInsight, setEditingInsight] = useState<any | null>(null);
  const [insightFormData, setInsightFormData] = useState({ 
    id: '', title: '', category: 'Hiring Guides', coverImageUrl: '/images/logo.png', readTime: '5 min read', author: 'Scrizians Editorial', status: 'Published' 
  });

  // Portfolio Modal Form
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<any | null>(null);
  const [portfolioFormData, setPortfolioFormData] = useState({
    id: '', scrizianId: 'SCR-8841', authorRole: 'Lead Architect', title: '', description: '', skills: 'Next.js, Node.js, AWS', coverImageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=70', isNdaProtected: false
  });

  // Client Requirements Search, Filter & Modal
  const [reqSearch, setReqSearch] = useState('');
  const [reqStatusFilter, setReqStatusFilter] = useState('All');
  const [selectedReqForModal, setSelectedReqForModal] = useState<any | null>(null);

  // Job Applicants Pipeline Modal
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState<any | null>(null);
  const [jobApplicantsList, setJobApplicantsList] = useState<any[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '+91 98765 43210',
    title: 'Scriza Super Admin',
    skills: 'Platform Governance, Executive Operations, User Management',
    avatar: ''
  });

  useEffect(() => {
    const stored = localStorage.getItem('scrizians_user');
    const token = localStorage.getItem('scrizians_token');

    if (!stored || !token) {
      router.replace('/login');
      return;
    }

    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u.role !== 'admin' && u.role !== 'scriza_staff') {
          router.replace('/login');
          return;
        }
        setCurrentUser(u);
        setEditFormData({
          name: u.name || '',
          phone: u.phone || '+91 98765 43210',
          title: u.title || 'Scriza Super Admin',
          skills: u.skills || 'Platform Governance, Executive Operations, User Management',
          avatar: u.avatar || ''
        });
      } catch (e) {
        router.replace('/login');
        return;
      }
    }

    const loadFromApi = () => {
      adminApi.getStats().then(res => { if (res.success && res.data) setAdminStats(res.data); });
      leadApi.getAll('limit=100').then(res => { if (res.success && Array.isArray(res.data)) setLeads(res.data.map(adaptLead)); });
      talentApi.getAll('limit=100').then(res => { if (res.success && Array.isArray(res.data)) setTalents(res.data.map(adaptTalent)); });
      jobApi.getAll('limit=100').then(res => { if (res.success && Array.isArray(res.data)) setJobs(res.data.map(adaptJob)); });
      articleApi.adminList('limit=100').then(res => {
        if (res.success && Array.isArray(res.data)) {
          setInsights(res.data.map((a: any) => ({ ...adaptArticle(a), status: a.status })));
        }
      });
      portfolioApi.getPublic().then(res => { if (res.success && Array.isArray(res.data)) setPortfolios(res.data.map(adaptPortfolio)); });
      caseStudyApi.adminList('limit=100').then(res => { if (res.success && Array.isArray(res.data)) setCaseStudies(res.data); });
      adminApi.getRequirements('limit=100').then(res => { if (res.success && Array.isArray(res.data)) setAdminRequirements(res.data); });
      adminApi.getUsers().then(res => { if (res.success && Array.isArray(res.data)) setUsersList(res.data); });
    };

    loadFromApi();
    window.addEventListener('scrizians_storage_updated', loadFromApi);
    window.addEventListener('storage', loadFromApi);

    return () => {
      window.removeEventListener('scrizians_storage_updated', loadFromApi);
      window.removeEventListener('storage', loadFromApi);
    };
  }, []);

  const displayName = currentUser?.name || 'Scriza Super Admin';
  const displayEmail = currentUser?.email || 'admin@scrizians.com';

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authApi.updateProfile({
        name: editFormData.name,
        phone: editFormData.phone,
        title: editFormData.title,
        avatar: editFormData.avatar
      });

      const updatedUser = {
        ...currentUser,
        name: editFormData.name,
        phone: editFormData.phone,
        title: editFormData.title,
        skills: editFormData.skills,
        avatar: editFormData.avatar || currentUser?.avatar
      };

      setCurrentUser(updatedUser);
      localStorage.setItem('scrizians_user', JSON.stringify(updatedUser));
      setIsEditingProfile(false);
      showToast('🎉 Admin Profile updated successfully in MongoDB database!');
    } catch (err) {
      console.warn('Save admin profile error:', err);
      showToast('🎉 Profile saved locally!');
      setIsEditingProfile(false);
    }
  };

  // --- USER ACTIONS ---
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserFormData({
      id: '',
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'client',
      avatar: '',
      title: ''
    });
    setShowUserForm(true);
  };

  const handleOpenEditUser = (u: any) => {
    setEditingUser(u);
    setUserFormData({
      id: u._id || u.id,
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      password: '',
      role: u.role || 'client',
      avatar: u.avatar || '',
      title: u.title || ''
    });
    setShowUserForm(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name || (!userFormData.email && !userFormData.phone)) {
      showToast('⚠️ Please provide name and email or phone');
      return;
    }

    try {
      if (editingUser) {
        const res = await adminApi.updateUser(userFormData.id, userFormData);
        if (res.success && res.data) {
          setUsersList(prev => prev.map(u => (u._id === userFormData.id || u.id === userFormData.id) ? { ...u, ...res.data } : u));
          showToast(`✓ User ${userFormData.name} updated!`);
        } else {
          showToast(res.error || res.message || 'Failed to update user');
        }
      } else {
        const res = await adminApi.createUser(userFormData);
        if (res.success && res.data) {
          setUsersList(prev => [res.data, ...prev]);
          showToast(`🎉 New user ${userFormData.name} created!`);
        } else {
          showToast(res.error || res.message || 'Failed to create user');
        }
      }
    } catch (err: any) {
      showToast('Failed to save user: ' + (err.message || 'Unknown error'));
    }
    setShowUserForm(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await adminApi.deleteUser(id);
      if (res.success) {
        setUsersList(prev => prev.filter(u => (u._id || u.id) !== id));
        showToast('🗑️ User deleted successfully');
      } else {
        showToast(res.error || res.message || 'Failed to delete user');
      }
    } catch (err) {
      showToast('Failed to delete user');
    }
  };

  // Helper function for local image file reader preview
  const handleImageUpload = (file: File, callback: (url: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        callback(reader.result as string);
        showToast('🖼️ Image uploaded & preview ready!');
      }
    };
    reader.readAsDataURL(file);
  };

  // --- LEADS ACTIONS ---
  const handleUpdateLeadStage = async (leadId: string, newStage: string) => {
    try {
      const res = await leadApi.update(leadId, { stage: newStage });
      if (res.success) {
        const updated = leads.map(l => (l._id === leadId || l.id === leadId) ? { ...l, stage: newStage } : l);
        setLeads(updated);
        saveStoredData('scrizians_leads_list', updated);
        showToast(`✓ Pipeline stage updated to "${newStage}" in MongoDB!`);
      } else {
        showToast(res.error || res.message || 'Failed to update lead stage');
      }
    } catch (err: any) {
      showToast('Error updating lead stage');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      const res = await leadApi.delete(leadId);
      if (res.success) {
        const updated = leads.filter(l => (l._id || l.id) !== leadId);
        setLeads(updated);
        deleteStoredData('scrizians_leads_list', leadId, updated);
        if (selectedLead?._id === leadId || selectedLead?.id === leadId) setSelectedLead(null);
        showToast('🗑️ Lead deleted successfully from MongoDB');
      } else {
        showToast(res.error || res.message || 'Failed to delete lead');
      }
    } catch (err) {
      showToast('Error deleting lead');
    }
  };

  // --- TALENT ACTIONS ---
  const handleOpenAddTalent = () => {
    setEditingTalent(null);
    setTalentFormData({ id: `SZN-DEV-${Math.floor(10000 + Math.random() * 90000)}`, displayName: '', title: '', hourlyRateUSD: '35', availability: 'Immediate', skills: '', avatarUrl: '/images/logo.png', status: 'Verified' });
    setShowTalentModal(true);
  };

  const handleOpenEditTalent = (t: any) => {
    setEditingTalent(t);
    setTalentFormData({ id: t.id || t.scrizianId, displayName: t.displayName, title: t.title, hourlyRateUSD: String(t.hourlyRateUSD), availability: t.availability, skills: Array.isArray(t.skills) ? t.skills.join(', ') : t.skills, avatarUrl: t.avatarUrl || '/images/logo.png', status: t.status });
    setShowTalentModal(true);
  };

  const handleSaveTalent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!talentFormData.displayName || !talentFormData.title) return;

    try {
      if (editingTalent) {
        const targetId = editingTalent._id || editingTalent.id || editingTalent.scrizianId;
        const res = await talentApi.update(targetId, {
          ...talentFormData,
          hourlyRateUSD: Number(talentFormData.hourlyRateUSD)
        });
        if (res.success && res.data) {
          const fresh = adaptTalent(res.data);
          setTalents(prev => prev.map(t => (t.id === targetId || t._id === targetId || t.scrizianId === targetId) ? fresh : t));
          showToast(`✓ Scrizian ${fresh.displayName} updated!`);
        } else {
          showToast(res.error || res.message || 'Failed to update talent profile');
        }
      } else {
        const res = await talentApi.create({
          ...talentFormData,
          hourlyRateUSD: Number(talentFormData.hourlyRateUSD)
        });
        if (res.success && res.data) {
          const fresh = adaptTalent(res.data);
          setTalents(prev => [fresh, ...prev]);
          showToast(`🎉 New Scrizian ${fresh.displayName} created!`);
        } else {
          showToast(res.error || res.message || 'Failed to create talent profile');
        }
      }
    } catch (err: any) {
      showToast('API request failed: ' + (err.message || 'Unknown error'));
    }

    setShowTalentModal(false);
  };

  const handleDeleteTalent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this talent profile?')) return;
    try {
      const res = await talentApi.delete(id);
      if (res.success) {
        setTalents(prev => prev.filter(t => t.id !== id && t.scrizianId !== id && t._id !== id));
        showToast(`🗑️ Scrizian profile deleted successfully`);
      } else {
        showToast(res.error || res.message || 'Failed to delete talent profile');
      }
    } catch (err: any) {
      showToast('Failed to delete talent profile');
    }
  };

  const handleToggleVerifyTalent = async (id: string, newStatus?: string) => {
    try {
      const current = talents.find(t => t.id === id || t.scrizianId === id || t._id === id);
      const targetStatus = newStatus || (current?.status === 'Verified' ? 'Pending Review' : 'Verified');
      const res = await talentApi.update(id, { status: targetStatus });
      if (res.success) {
        const updated = talents.map(t => (t.id === id || t.scrizianId === id || t._id === id) ? { ...t, status: targetStatus } : t);
        setTalents(updated);
        saveStoredData('scrizians_talent_list', updated);
        showToast(`✓ Scrizian ${id} status updated to "${targetStatus}"!`);
      } else {
        showToast(res.error || res.message || 'Failed to update talent status');
      }
    } catch (err) {
      showToast('Error updating talent status');
    }
  };

  const handleToggleApproveArticle = (id: string) => {
    const updated = insights.map(art => {
      if (art.id === id || art._id === id) {
        const nextStatus = art.status === 'Published' ? 'Draft' : 'Published';
        const articleKey = art._id || art.id;
        (nextStatus === 'Published' ? articleApi.publish(articleKey) : articleApi.workflow(articleKey, 'Draft'))
          .then(r => { if (!r.success) showToast(r.error || 'Could not update article status'); });
        return { ...art, status: nextStatus };
      }
      return art;
    });
    setInsights(updated);
    saveStoredData('scrizians_insights_list', updated);
    showToast(`✓ Article publication status updated!`);
  };

  // --- JOBS ACTIONS ---
  const handleOpenAddJob = () => {
    setEditingJob(null);
    setJobFormData({ id: `job-${jobs.length + 101}`, title: '', company: 'Scriza Client Partner', companyLogoUrl: '/images/logo.png', location: 'Remote (India / Global)', rate: '$30 - $40 / hr', status: 'Active' });
    setShowJobModal(true);
  };

  const handleOpenEditJob = (j: any) => {
    setEditingJob(j);
    setJobFormData({ id: j.id, title: j.title, company: j.company, companyLogoUrl: j.companyLogoUrl || '/images/logo.png', location: j.location, rate: j.rate || j.salaryUSD, status: j.status });
    setShowJobModal(true);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobFormData.title) return;

    try {
      if (editingJob) {
        const jobId = editingJob._id || editingJob.id || editingJob.slug;
        const res = await jobApi.update(jobId, jobFormData);
        if (res.success && res.data) {
          const adapted = adaptJob(res.data);
          const updated = jobs.map(j => (j.id === editingJob.id || j._id === editingJob._id) ? { ...j, ...adapted } : j);
          setJobs(updated);
          saveStoredData('scrizians_jobs_list', updated);
        }
        showToast(`✓ Job Opening ${editingJob.id || editingJob.title} updated!`);
      } else {
        const res = await jobApi.create(jobFormData);
        if (res.success && res.data) {
          const adapted = adaptJob(res.data);
          const updated = [adapted, ...jobs];
          setJobs(updated);
          saveStoredData('scrizians_jobs_list', updated);
        } else {
          const created = { ...jobFormData, applicantsCount: 0 };
          const updated = [created, ...jobs];
          setJobs(updated);
          saveStoredData('scrizians_jobs_list', updated);
        }
        showToast('🎉 New Job Opening posted with logo!');
      }
    } catch (err) {
      console.error('handleSaveJob error:', err);
      showToast('⚠️ Error saving job opening to backend');
    }

    setShowJobModal(false);
  };

  const handleDeleteJob = async (id: string) => {
    try {
      await jobApi.delete(id);
    } catch (err) {
      console.warn('handleDeleteJob error:', err);
    }
    const updated = jobs.filter(j => j.id !== id && j.slug !== id && j._id !== id);
    setJobs(updated);
    deleteStoredData('scrizians_jobs_list', id, updated);
    showToast(`🗑️ Job Opening deleted successfully`);
  };

  const handleToggleJobStatus = async (id: string) => {
    let nextStatus = 'Active';
    const updated = jobs.map(j => {
      if (j.id === id || j.slug === id || j._id === id) {
        nextStatus = (j.status === 'Active' || j.status === 'Verified') ? 'Inactive' : 'Active';
        return { ...j, status: nextStatus };
      }
      return j;
    });
    setJobs(updated);
    saveStoredData('scrizians_jobs_list', updated);
    try {
      await jobApi.update(id, { status: nextStatus });
    } catch (err) {
      console.warn('Toggle job status error:', err);
    }
    showToast(`✓ Job Opening status updated!`);
  };

  // --- CLIENT REQUIREMENTS ACTIONS ---
  const handleReviewRequirement = async (id: string, newStatus: string) => {
    try {
      const res = await adminApi.reviewRequirement(id, { status: newStatus });
      if (res.success) {
        setAdminRequirements(prev =>
          prev.map(r => ((r._id === id || r.id === id) ? { ...r, status: newStatus } : r))
        );
        showToast(`✓ Requirement stage moved to ${newStatus}`);
      } else {
        showToast(res.message || 'Failed to update requirement status');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error updating requirement status');
    }
  };

  const handleDeleteRequirement = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this client requirement? This action cannot be undone.')) return;
    try {
      const res = await adminApi.deleteRequirement(id);
      if (res.success) {
        setAdminRequirements(prev => prev.filter(r => r._id !== id && r.id !== id));
        if (selectedReqForModal && (selectedReqForModal._id === id || selectedReqForModal.id === id)) {
          setSelectedReqForModal(null);
        }
        showToast('✓ Client requirement deleted successfully');
      } else {
        showToast(res.message || 'Failed to delete requirement');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error deleting requirement');
    }
  };

  // --- JOB APPLICANTS PIPELINE ACTIONS ---
  const handleOpenJobApplicants = async (job: any) => {
    setSelectedJobForApplicants(job);
    setLoadingApplicants(true);
    try {
      const queryParam = job.slug ? `jobSlug=${job.slug}` : `jobId=${job.id || job._id}`;
      const res = await jobApi.adminGetApplications(queryParam);
      if (res.success && Array.isArray(res.data)) {
        setJobApplicantsList(res.data);
      } else {
        setJobApplicantsList([]);
      }
    } catch (err) {
      console.warn('Failed to fetch job applicants:', err);
      setJobApplicantsList([]);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleUpdateApplicantStatus = async (appId: string, newStatus: string) => {
    try {
      const res = await jobApi.adminUpdateApplicationStatus(appId, newStatus);
      if (res.success) {
        setJobApplicantsList(prev =>
          prev.map(a => (a._id === appId ? { ...a, status: newStatus } : a))
        );
        showToast(`✓ Applicant status updated to ${newStatus}`);
      } else {
        showToast(res.message || 'Failed to update applicant status');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error updating applicant status');
    }
  };

  // --- INSIGHTS / ARTICLES ACTIONS ---
  const handleOpenAddInsight = () => {
    setEditingInsight(null);
    setInsightFormData({ id: `art-${insights.length + 1}`, title: '', category: 'Hiring Guides', coverImageUrl: '/images/logo.png', readTime: '5 min read', author: 'Scrizians Editorial', status: 'Published' });
    setShowInsightModal(true);
  };

  const handleOpenEditInsight = (art: any) => {
    setEditingInsight(art);
    setInsightFormData({ id: art.id, title: art.title, category: art.category, coverImageUrl: art.coverImageUrl || '/images/logo.png', readTime: art.readTime, author: art.author, status: art.status });
    setShowInsightModal(true);
  };

  const handleSaveInsight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!insightFormData.title) return;

    try {
      if (editingInsight) {
        const articleId = editingInsight._id || editingInsight.id || editingInsight.slug;
        const res = await articleApi.adminUpdate(articleId, insightFormData);
        if (res.success && res.data) {
          const adapted = { ...adaptArticle(res.data), status: res.data.status };
          const updated = insights.map(a => (a.id === editingInsight.id || a._id === editingInsight._id) ? { ...a, ...adapted } : a);
          setInsights(updated);
          saveStoredData('scrizians_insights_list', updated);
        }
        showToast(`✓ Article "${insightFormData.title.substring(0, 20)}..." updated!`);
      } else {
        const payload = {
          title: insightFormData.title,
          content: insightFormData.title,
          excerpt: insightFormData.title,
          category: insightFormData.category,
          featuredImage: insightFormData.coverImageUrl,
          status: 'Published'
        };
        const res = await articleApi.create(payload);
        if (res.success && res.data) {
          const adapted = { ...adaptArticle(res.data), status: res.data.status };
          const updated = [adapted, ...insights];
          setInsights(updated);
          saveStoredData('scrizians_insights_list', updated);
        } else {
          const created = { ...insightFormData, publishedDate: 'Just now' };
          const updated = [created, ...insights];
          setInsights(updated);
          saveStoredData('scrizians_insights_list', updated);
        }
        showToast('🎉 New Article Published with Cover Image!');
      }
    } catch (err) {
      console.error('handleSaveInsight error:', err);
      showToast('⚠️ Error saving article to backend');
    }

    setShowInsightModal(false);
  };

  const handleDeleteInsight = async (id: string) => {
    try {
      await articleApi.adminDelete(id);
    } catch (err) {
      console.warn('handleDeleteInsight error:', err);
    }
    const updated = insights.filter(a => a.id !== id && a._id !== id && a.slug !== id);
    setInsights(updated);
    deleteStoredData('scrizians_insights_list', id, updated);
    showToast('🗑️ Article deleted successfully');
  };

  // --- PORTFOLIO ACTIONS ---
  const handleOpenAddPortfolio = () => {
    setEditingPortfolio(null);
    setPortfolioFormData({
      id: `port-${Date.now()}`,
      scrizianId: 'SCR-8841',
      authorRole: 'Lead Architect',
      title: '',
      description: '',
      skills: 'Next.js, Node.js, AWS',
      coverImageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=70',
      isNdaProtected: false
    });
    setShowPortfolioModal(true);
  };

  const handleOpenEditPortfolio = (p: any) => {
    setEditingPortfolio(p);
    setPortfolioFormData({
      id: p.id || p._id,
      scrizianId: p.scrizianId || 'SCR-8841',
      authorRole: p.authorRole || 'Lead Architect',
      title: p.title || '',
      description: p.description || '',
      skills: Array.isArray(p.skills) ? p.skills.join(', ') : (p.skills || ''),
      coverImageUrl: p.coverImageUrl || '/images/logo.png',
      isNdaProtected: !!p.isNdaProtected
    });
    setShowPortfolioModal(true);
  };

  const handleSavePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolioFormData.title) return;

    const skillsArray = portfolioFormData.skills.split(',').map(s => s.trim()).filter(Boolean);
    const payload = {
      ...portfolioFormData,
      skills: skillsArray
    };

    try {
      if (editingPortfolio) {
        const portId = editingPortfolio._id || editingPortfolio.id;
        const res = await portfolioApi.update(portId, payload);
        if (res.success && res.data) {
          const adapted = adaptPortfolio(res.data);
          const updated = portfolios.map(p => (p.id === editingPortfolio.id || p._id === editingPortfolio._id) ? { ...p, ...adapted } : p);
          setPortfolios(updated);
          saveStoredData('scrizians_portfolio_list', updated);
        }
        showToast(`✓ Portfolio Project "${portfolioFormData.title.substring(0, 20)}..." updated!`);
      } else {
        const res = await portfolioApi.create(payload);
        if (res.success && res.data) {
          const adapted = adaptPortfolio(res.data);
          const updated = [adapted, ...portfolios];
          setPortfolios(updated);
          saveStoredData('scrizians_portfolio_list', updated);
        } else {
          const updated = [payload, ...portfolios];
          setPortfolios(updated);
          saveStoredData('scrizians_portfolio_list', updated);
        }
        showToast('🎉 New Portfolio Project Showcase created!');
      }
    } catch (err) {
      console.error('handleSavePortfolio error:', err);
      showToast('⚠️ Error saving portfolio project to backend');
    }

    setShowPortfolioModal(false);
  };

  const handleDeletePortfolio = async (id: string) => {
    try {
      await portfolioApi.delete(id);
    } catch (err) {
      console.warn('handleDeletePortfolio error:', err);
    }
    const updated = portfolios.filter(p => p.id !== id && p._id !== id);
    setPortfolios(updated);
    deleteStoredData('scrizians_portfolio_list', id, updated);
    showToast(`🗑️ Portfolio Project deleted successfully`);
  };

  const handleToggleNdaPortfolio = (p: any) => {
    const updated = portfolios.map(item => {
      if (item.id === p.id || item._id === p._id) {
        const nextNda = !item.isNdaProtected;
        const updatedItem = { ...item, isNdaProtected: nextNda };
        return updatedItem;
      }
      return item;
    });
    setPortfolios(updated);
    saveStoredData('scrizians_portfolio_list', updated);
    showToast(`✓ NDA Protection status updated!`);
  };

  // --- CASE STUDY ACTIONS ---
  const handleOpenAddCaseStudy = () => {
    setEditingCaseStudy(null);
    setCaseStudyFormData({ id: '', title: '', slug: '', category: 'SaaS Development', region: 'United States', challenge: '', solution: '', deliveryTime: '12 wks', status: 'Published' });
    setShowCaseStudyModal(true);
  };

  const handleOpenEditCaseStudy = (cs: any) => {
    setEditingCaseStudy(cs);
    setCaseStudyFormData({
      id: cs._id || cs.id,
      title: cs.title || '',
      slug: cs.slug || '',
      category: cs.category || 'SaaS Development',
      region: cs.region || 'United States',
      challenge: cs.challenge || '',
      solution: cs.solution || '',
      deliveryTime: cs.deliveryTime || '12 wks',
      status: cs.status || 'Published'
    });
    setShowCaseStudyModal(true);
  };

  const handleSaveCaseStudy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseStudyFormData.title) return;

    if (editingCaseStudy) {
      const res = await caseStudyApi.update(editingCaseStudy._id || editingCaseStudy.id, caseStudyFormData);
      if (res.success) {
        showToast('✓ Case Study updated!');
      } else {
        showToast(res.error || 'Could not update Case Study');
      }
    } else {
      const res = await caseStudyApi.create(caseStudyFormData);
      if (res.success) {
        showToast('🎉 Case Study created!');
      } else {
        showToast(res.error || 'Could not create Case Study');
      }
    }

    const updatedList = await caseStudyApi.adminList('limit=100');
    if (updatedList.success && Array.isArray(updatedList.data)) {
      setCaseStudies(updatedList.data);
    }
    setShowCaseStudyModal(false);
  };

  const handleDeleteCaseStudy = async (id: string) => {
    const res = await caseStudyApi.delete(id);
    if (res.success) {
      setCaseStudies(caseStudies.filter(c => (c._id || c.id) !== id));
      showToast('🗑️ Case Study deleted');
    } else {
      showToast(res.error || 'Could not delete Case Study');
    }
  };

  const handlePublishCaseStudy = async (id: string) => {
    const res = await caseStudyApi.publish(id);
    if (res.success) {
      setCaseStudies(caseStudies.map(c => (c._id === id || c.id === id) ? { ...c, status: 'Published' } : c));
      showToast('✓ Case Study published!');
    } else {
      showToast(res.error || 'Could not publish Case Study');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('scrizians_token');
    localStorage.removeItem('scrizians_user');
    router.push('/login');
  };

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.scrizianIdReferenced.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const LEADS_PER_PAGE = 10;
  const totalLeadsPages = Math.max(1, Math.ceil(filteredLeads.length / LEADS_PER_PAGE));
  const paginatedLeads = filteredLeads.slice((leadsPage - 1) * LEADS_PER_PAGE, leadsPage * LEADS_PER_PAGE);

  const TALENT_PER_PAGE = 10;
  const totalTalentPages = Math.max(1, Math.ceil(talents.length / TALENT_PER_PAGE));
  const paginatedTalents = talents.slice((talentPage - 1) * TALENT_PER_PAGE, talentPage * TALENT_PER_PAGE);

  const JOBS_PER_PAGE = 10;
  const totalJobsPages = Math.max(1, Math.ceil(jobs.length / JOBS_PER_PAGE));
  const paginatedJobs = jobs.slice((jobsPage - 1) * JOBS_PER_PAGE, jobsPage * JOBS_PER_PAGE);

  const INSIGHTS_PER_PAGE = 10;
  const totalInsightsPages = Math.max(1, Math.ceil(insights.length / INSIGHTS_PER_PAGE));
  const paginatedInsights = insights.slice((insightsPage - 1) * INSIGHTS_PER_PAGE, insightsPage * INSIGHTS_PER_PAGE);

  const filteredPortfolios = portfolios.filter(p =>
    (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.authorRole || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.scrizianId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const PORTFOLIO_PER_PAGE = 10;
  const totalPortfolioPages = Math.max(1, Math.ceil(filteredPortfolios.length / PORTFOLIO_PER_PAGE));
  const paginatedPortfolios = filteredPortfolios.slice((portfolioPage - 1) * PORTFOLIO_PER_PAGE, portfolioPage * PORTFOLIO_PER_PAGE);

  return (
    <div className={styles.dashboardLayout}>
      <DashboardSidebar 
        role="admin" 
        activeTab={activeTab} 
        onTabChange={(t: any) => setActiveTab(t)} 
        user={currentUser || { name: displayName, role: 'admin', email: displayEmail }} 
        isCollapsed={isSidebarCollapsed}
      />

      <div className={`${styles.container} ${isSidebarCollapsed ? styles.containerCollapsed : ''}`}>
        {/* Animated Top-Right Toast Notification */}
        {notification && (
          <div className={styles.toastContainer}>
            <div className={styles.toastCard}>
              <span style={{ fontSize: '1.1rem' }}>⚡</span>
              <span>{notification}</span>
              <button onClick={() => setNotification(null)} className={styles.toastClose}>×</button>
            </div>
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
              <span>Operations & Admin Dashboard</span>
            </div>
          </div>

          <div className={styles.topNavbarRight}>
            {/* Notification Bell */}
            <div className={styles.bellWrapper}>
              <NotificationBell />
            </div>

            {/* Dynamic Admin Profile Pill */}
            <div 
              className={styles.adminProfilePill}
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              <div className={styles.adminAvatarCircle}>
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Admin" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  (currentUser?.name || displayName || 'A').charAt(0).toUpperCase()
                )}
              </div>
              <div className={styles.adminProfileText}>
                <span className={styles.adminProfileName}>{currentUser?.name || displayName}</span>
                <span className={styles.adminProfileRole}>{currentUser?.role === 'admin' ? 'Super Admin' : (currentUser?.role || 'Admin')}</span>
              </div>
              <span className={styles.adminChevron}>▼</span>

              {showProfileDropdown && (
                <div className={styles.profileDropdown} onClick={(e) => e.stopPropagation()}>
                  <button 
                    className={styles.profileDropdownItem}
                    onClick={() => {
                      setShowProfileDropdown(false);
                      setActiveTab('profile');
                      setIsEditingProfile(false);
                    }}
                  >
                    <span>👤</span> Profile
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
          {/* TAB 0: Main Dashboard Overview */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Row 1: Top Hero & Category Previews */}
              <div className={styles.overviewGrid}>
                {/* 1. Welcome Card */}
                <div className={styles.overviewWelcomeCard}>
                  <div>
                    <h3 className={styles.welcomeTitle}>
                      Welcome {currentUser?.name || displayName}!
                    </h3>
                    <p className={styles.welcomeSub}>
                      Role: Super Admin | Dashboard overview, roster management, and platform governance.
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

                {/* 2. Core Domains & Sectors */}
                <div className={styles.overviewCard}>
                  <div className={styles.cardHeaderRow}>
                    <div className={styles.cardHeaderTitle}>
                      Domains & Specializations <span className={styles.cardHeaderCount}>8</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('talent')}
                      className={styles.cardViewAllLink}
                    >
                      View All
                    </button>
                  </div>
                  <div className={styles.miniCardsRow}>
                    <div className={styles.miniCard}>
                      <span className={styles.miniCardIcon}>💻</span>
                      <span className={styles.miniCardLabel}>Engineering</span>
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

                {/* 3. Total Specialists Preview */}
                <div className={styles.overviewCard}>
                  <div className={styles.cardHeaderRow}>
                    <div className={styles.cardHeaderTitle}>
                      Total Specialists <span className={styles.cardHeaderCount}>{talents.length}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('talent')}
                      className={styles.cardViewAllLink}
                    >
                      View All
                    </button>
                  </div>
                  <div className={styles.miniCardsRow}>
                    {talents.slice(0, 3).map((t, idx) => (
                      <div key={t.id || t.scrizianId || idx} className={styles.miniCard}>
                        <img 
                          src={t.avatarUrl || '/images/logo.png'} 
                          alt="" 
                          className={styles.miniCardImg} 
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/logo.png'; }}
                        />
                        <span className={styles.miniCardLabel} title={t.displayName}>
                          {t.displayName ? t.displayName.split(' ')[0] : `Specialist ${idx + 1}`}
                        </span>
                      </div>
                    ))}
                    {talents.length < 3 && [1, 2, 3].slice(talents.length).map((_, idx) => (
                      <div key={`dummy-talent-${idx}`} className={styles.miniCard}>
                        <div className={styles.listAvatarFallback}>SCR</div>
                        <span className={styles.miniCardLabel}>Scrizian</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 2: Charts & Client Requests */}
              <div className={styles.overviewGrid}>
                {/* 4. Availability Donut Chart */}
                <div className={styles.overviewCard}>
                  <div className={styles.cardHeaderRow}>
                    <div className={styles.cardHeaderTitle}>
                      Specialist Availability <span className={styles.cardHeaderCount}>{talents.length}</span>
                    </div>
                  </div>
                  <div className={styles.chartContainer}>
                    <svg width="130" height="130" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="45" fill="none" stroke="#F1F5F9" strokeWidth="18" />
                      {/* Immediate (Green) */}
                      <circle
                        cx="60"
                        cy="60"
                        r="45"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="18"
                        strokeDasharray="231 283"
                        strokeDashoffset="0"
                        transform="rotate(-90 60 60)"
                      />
                      {/* Engaged (Brand Red) */}
                      <circle
                        cx="60"
                        cy="60"
                        r="45"
                        fill="none"
                        stroke="#E52B2B"
                        strokeWidth="18"
                        strokeDasharray="51 283"
                        strokeDashoffset="-231"
                        transform="rotate(-90 60 60)"
                      />
                      <text x="60" y="65" textAnchor="middle" fontSize="16" fontWeight="800" fill="#0F172A">
                        {talents.length}
                      </text>
                    </svg>
                    <div className={styles.chartLegend}>
                      <div className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: '#10B981' }} />
                        <span>Immediate <strong>{Math.max(1, talents.length - 4)}</strong></span>
                      </div>
                      <div className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: '#E52B2B' }} />
                        <span>Engaged <strong>{Math.min(4, talents.length)}</strong></span>
                      </div>
                      <div className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: '#F59E0B' }} />
                        <span>In Review <strong>0</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Domain Distribution Pie Chart */}
                <div className={styles.overviewCard}>
                  <div className={styles.cardHeaderRow}>
                    <div className={styles.cardHeaderTitle}>
                      Domain Distribution (Specialty Wise)
                    </div>
                  </div>
                  <div className={styles.chartContainer}>
                    <svg width="130" height="130" viewBox="0 0 120 120">
                      {/* Slice 1: Full-Stack (48% - #0F1D33) */}
                      <path d="M 60 60 L 60 15 A 45 45 0 0 1 65.6 104.6 Z" fill="#0F1D33" />
                      {/* Slice 2: AI & ML (32% - #E52B2B) */}
                      <path d="M 60 60 L 65.6 104.6 A 45 45 0 0 1 17.2 46.1 Z" fill="#E52B2B" />
                      {/* Slice 3: DevOps & Cloud (20% - #94A3B8) */}
                      <path d="M 60 60 L 17.2 46.1 A 45 45 0 0 1 60 15 Z" fill="#94A3B8" />
                    </svg>
                    <div className={styles.chartLegend}>
                      <div className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: '#0F1D33' }} />
                        <span>Full-Stack <strong>48%</strong></span>
                      </div>
                      <div className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: '#E52B2B' }} />
                        <span>AI & ML <strong>32%</strong></span>
                      </div>
                      <div className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: '#94A3B8' }} />
                        <span>Cloud <strong>20%</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. Client Talent Requests */}
                <div className={styles.overviewCard}>
                  <div className={styles.cardHeaderRow}>
                    <div className={styles.cardHeaderTitle}>
                      Client Talent Requests
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('requirements')}
                      className={styles.cardViewAllLink}
                    >
                      View All
                    </button>
                  </div>
                  {adminRequirements && adminRequirements.length > 0 ? (
                    <div className={styles.listItemsWrapper}>
                      {adminRequirements.slice(0, 3).map((req: any, idx: number) => (
                        <div key={req._id || req.id || idx} className={styles.listRowItem}>
                          <div>
                            <div className={styles.listTitle}>{req.serviceRequested || req.roleTitle || 'Custom Engagement'}</div>
                            <div className={styles.listSub}>{req.company || req.clientEmail || 'Client Requirement'}</div>
                          </div>
                          <div className={styles.listRightBadge} style={{ color: '#E52B2B' }}>
                            {req.status || 'Pending'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyStateNotice}>
                      <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>📋</div>
                      <div className={styles.emptyStateTitle}>No Pending Talent Requests</div>
                      <div className={styles.emptyStateText}>Client hiring requests will appear here once submitted.</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3: Announcements & Recent Records */}
              <div className={styles.overviewGrid}>
                {/* 7. Platform Announcements */}
                <div className={styles.overviewCard}>
                  <div className={styles.cardHeaderRow}>
                    <div className={styles.cardHeaderTitle}>
                      Platform Announcements
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('insights')}
                      className={styles.cardViewAllLink}
                    >
                      View All
                    </button>
                  </div>
                  <div className={styles.emptyStateNotice}>
                    <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>📢</div>
                    <div className={styles.emptyStateTitle}>No Active Announcements</div>
                    <div className={styles.emptyStateText}>Operational notices and system announcements will appear here.</div>
                  </div>
                </div>

                {/* 8. Top Verified Specialists */}
                <div className={styles.overviewCard}>
                  <div className={styles.cardHeaderRow}>
                    <div className={styles.cardHeaderTitle}>
                      Top Verified Specialists
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('talent')}
                      className={styles.cardViewAllLink}
                    >
                      View All
                    </button>
                  </div>
                  <div className={styles.listItemsWrapper}>
                    {talents.slice(0, 3).map((t, idx) => (
                      <div key={t.id || t.scrizianId || idx} className={styles.listRowItem}>
                        <div className={styles.listRowLeft}>
                          <img 
                            src={t.avatarUrl || '/images/logo.png'} 
                            alt="" 
                            className={styles.listAvatar} 
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/logo.png'; }}
                          />
                          <div>
                            <div className={styles.listTitle}>{t.displayName}</div>
                            <div className={styles.listSub}>{t.title}</div>
                          </div>
                        </div>
                        <div className={styles.listRightBadge} style={{ color: '#0F172A', fontWeight: 800 }}>
                          ${t.hourlyRateUSD}/hr
                        </div>
                      </div>
                    ))}
                    {talents.length === 0 && (
                      <div className={styles.emptyStateNotice}>
                        <div className={styles.emptyStateTitle}>No specialists enrolled yet</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 9. Active Job Openings */}
                <div className={styles.overviewCard}>
                  <div className={styles.cardHeaderRow}>
                    <div className={styles.cardHeaderTitle}>
                      Active Job Openings
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('jobs')}
                      className={styles.cardViewAllLink}
                    >
                      View All
                    </button>
                  </div>
                  <div className={styles.listItemsWrapper}>
                    {jobs.slice(0, 3).map((j, idx) => (
                      <div key={j.id || idx} className={styles.listRowItem}>
                        <div>
                          <div className={styles.listTitle}>{j.title}</div>
                          <div className={styles.listSub}>{j.company}</div>
                        </div>
                        <div className={styles.listRightBadge} style={{ color: '#E52B2B', fontSize: '0.76rem', fontWeight: 700 }}>
                          {j.status || 'Active'}
                        </div>
                      </div>
                    ))}
                    {jobs.length === 0 && (
                      <div className={styles.emptyStateNotice}>
                        <div className={styles.emptyStateTitle}>No active openings found</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 4: Showcase & Editorial Highlights */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div className={styles.overviewCard} style={{ minHeight: 'auto' }}>
                  <div className={styles.cardHeaderRow}>
                    <div className={styles.cardHeaderTitle}>
                      Featured Showcase Projects <span className={styles.cardHeaderCount}>{portfolios.length}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('portfolio')}
                      className={styles.cardViewAllLink}
                    >
                      View All
                    </button>
                  </div>
                  <div className={styles.listItemsWrapper}>
                    {portfolios.slice(0, 2).map((p, idx) => (
                      <div key={p.id || idx} className={styles.listRowItem}>
                        <div>
                          <div className={styles.listTitle}>{p.title}</div>
                          <div className={styles.listSub}>{p.skills || p.authorRole}</div>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '6px', background: '#DCFCE7', color: '#166534' }}>
                          Showcase
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.overviewCard} style={{ minHeight: 'auto' }}>
                  <div className={styles.cardHeaderRow}>
                    <div className={styles.cardHeaderTitle}>
                      Editorial Insights & Articles <span className={styles.cardHeaderCount}>{insights.length}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('insights')}
                      className={styles.cardViewAllLink}
                    >
                      View All
                    </button>
                  </div>
                  <div className={styles.listItemsWrapper}>
                    {insights.slice(0, 2).map((ins, idx) => (
                      <div key={ins.id || idx} className={styles.listRowItem}>
                        <div>
                          <div className={styles.listTitle}>{ins.title}</div>
                          <div className={styles.listSub}>{ins.category} • {ins.readTime}</div>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '6px', background: '#F1F5F9', color: '#0F172A' }}>
                          {ins.status || 'Published'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}


        {activeTab === 'leads' && (
          selectedLead ? (
            <div className={styles.card}>
              <button 
                type="button"
                onClick={() => setSelectedLead(null)}
                className={styles.btnBack}
              >
                ← Back to Leads Pipeline
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.2rem', paddingBottom: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>
                <div>
                  <h3 className={styles.cardTitle} style={{ margin: 0 }}>Inbound Hiring Enquiry Details</h3>
                  <p className={styles.cardSub} style={{ margin: '0.2rem 0 0 0' }}>Lead ID: {selectedLead._id} | Date: {selectedLead.createdAt}</p>
                </div>
                <span style={{
                  padding: '0.3rem 0.8rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  background: '#DCFCE7',
                  color: '#166534'
                }}>
                  ● {selectedLead.stage || 'New Inbound Lead'}
                </span>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div><strong>Client Name:</strong> <div style={{ color: '#0F172A', fontWeight: 600 }}>{selectedLead.name}</div></div>
                  <div><strong>Email:</strong> <div style={{ color: '#0F172A', fontWeight: 600 }}>{selectedLead.email}</div></div>
                  <div><strong>Phone:</strong> <div style={{ color: '#0F172A', fontWeight: 600 }}>{selectedLead.phone}</div></div>
                  <div><strong>Company:</strong> <div style={{ color: '#0F172A', fontWeight: 600 }}>{selectedLead.company}</div></div>
                  <div><strong>Target Scrizian ID:</strong> <div><span style={{ fontFamily: 'monospace', color: '#E52B2B', fontWeight: 800 }}>{selectedLead.scrizianIdReferenced || 'General Inquiry'}</span></div></div>
                  <div><strong>Engagement Type:</strong> <div style={{ color: '#0F172A', fontWeight: 600 }}>{selectedLead.serviceRequested}</div></div>
                </div>
              </div>

              <div className={styles.formGroup} style={{ maxWidth: '400px', marginBottom: '1.2rem' }}>
                <label style={{ fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: '0.4rem' }}>Lead Pipeline Stage:</label>
                <select
                  value={selectedLead.stage || 'New Inbound Lead'}
                  onChange={e => {
                    const updatedStage = e.target.value;
                    handleUpdateLeadStage(selectedLead._id, updatedStage);
                    setSelectedLead({ ...selectedLead, stage: updatedStage });
                  }}
                  className={styles.formSelect}
                >
                  <option value="New Inbound Lead">🟢 New Inbound Lead</option>
                  <option value="Requirement Confirmed">📝 Requirement Confirmed</option>
                  <option value="Talent Shortlisted">🌟 Talent Shortlisted</option>
                  <option value="Contract Sent">📄 Contract Sent</option>
                  <option value="Hired / Closed">🏆 Hired / Closed</option>
                </select>
              </div>

              <div className={styles.formGroup} style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.4rem' }}>Requirement Message:</label>
                <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem', color: '#78350F', fontWeight: 600, lineHeight: 1.6 }}>
                  "{selectedLead.message || 'No specific requirement message provided.'}"
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <a 
                  href={`mailto:${selectedLead.email}?subject=Scrizians Enquiry - ${selectedLead.company}`}
                  className={styles.btnPrimaryAction}
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  ✉️ Reply via Email
                </a>
                <button onClick={() => setSelectedLead(null)} className={styles.btnCancelAction}>
                  Back to List
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <h3 className={styles.cardTitle} style={{ margin: 0 }}>Hiring Leads CRM</h3>
                  <p className={styles.cardSub} style={{ margin: '0.15rem 0 0 0' }}>
                    Manage inbound client leads & pipeline stages.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', background: '#F1F5F9', padding: '0.15rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <button 
                      onClick={() => setLeadViewMode('table')} 
                      style={{ background: leadViewMode === 'table' ? '#ffffff' : 'transparent', color: leadViewMode === 'table' ? '#0F172A' : '#64748B', border: 'none', padding: '0.3rem 0.65rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      📋 Table
                    </button>
                    <button 
                      onClick={() => setLeadViewMode('kanban')} 
                      style={{ background: leadViewMode === 'kanban' ? '#ffffff' : 'transparent', color: leadViewMode === 'kanban' ? '#0F172A' : '#64748B', border: 'none', padding: '0.3rem 0.65rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      📊 Kanban
                    </button>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search leads..." 
                    aria-label="Search inbound hiring leads CRM"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className={styles.formInput}
                    style={{ maxWidth: '180px', padding: '0.35rem 0.7rem', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              {leadViewMode === 'kanban' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
                  {['New', 'Qualified', 'Requirement Confirmed', 'Talent Shortlisted', 'Interview', 'Won'].map((colStage) => {
                    const columnLeads = filteredLeads.filter(l => l.stage === colStage || (!l.stage && colStage === 'New'));
                    return (
                      <div key={colStage} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem', minHeight: '380px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', paddingBottom: '0.5rem', borderBottom: '2px solid #CBD5E1' }}>
                          <strong style={{ fontSize: '0.85rem', color: '#0F172A' }}>{colStage}</strong>
                          <span style={{ background: '#0F172A', color: '#ffffff', borderRadius: '12px', padding: '0.1rem 0.5rem', fontSize: '0.75rem', fontWeight: 800 }}>
                            {columnLeads.length}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {columnLeads.map(lead => (
                            <div key={lead._id} style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.8rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A' }}>{lead.name}</div>
                              <div style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.2rem 0' }}>{lead.company} • {lead.serviceRequested}</div>
                              {lead.scrizianIdReferenced && (
                                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#E52B2B', background: 'rgba(229, 43, 43, 0.08)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                  {lead.scrizianIdReferenced}
                                </span>
                              )}
                              <div style={{ marginTop: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <select 
                                  value={lead.stage || 'New'} 
                                  onChange={e => handleUpdateLeadStage(lead._id, e.target.value)}
                                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid #CBD5E1' }}
                                >
                                  <option value="New">New</option>
                                  <option value="Contacted">Contacted</option>
                                  <option value="Qualified">Qualified</option>
                                  <option value="Requirement Confirmed">Confirmed</option>
                                  <option value="Talent Shortlisted">Shortlisted</option>
                                  <option value="Interview">Interview</option>
                                  <option value="Negotiation">Negotiation</option>
                                  <option value="Won">Won</option>
                                  <option value="Lost">Lost</option>
                                  <option value="Nurture">Nurture</option>
                                </select>
                                <button onClick={() => setSelectedLead(lead)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>👁️</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Client / Contact</th>
                        <th>Company</th>
                        <th>Target Scrizian ID</th>
                        <th>Engagement</th>
                        <th>Pipeline Stage</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLeads.map(lead => (
                        <tr key={lead._id}>
                          <td style={{ whiteSpace: 'nowrap' }}>{lead.createdAt}</td>
                          <td>
                            <strong>{lead.name}</strong><br/>
                            <span className={styles.subText}>{lead.email}</span>
                          </td>
                          <td>{lead.company || '—'}</td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#E52B2B' }}>
                              {lead.scrizianIdReferenced || 'N/A'}
                            </span>
                          </td>
                          <td>{lead.serviceRequested}</td>
                          <td>
                            <select 
                              value={lead.stage || 'New'}
                              aria-label={`Update pipeline stage for lead ${lead.name}`}
                              onChange={e => handleUpdateLeadStage(lead._id, e.target.value)}
                              className={styles.selectStatus}
                            >
                              <option value="New">● New</option>
                              <option value="Contacted">● Contacted</option>
                              <option value="Qualified">● Qualified</option>
                              <option value="Requirement Confirmed">● Requirement Confirmed</option>
                              <option value="Talent Shortlisted">● Talent Shortlisted</option>
                              <option value="Interview">● Interview</option>
                              <option value="Negotiation">● Negotiation</option>
                              <option value="Won">● Won / Closed</option>
                              <option value="Lost">● Lost</option>
                              <option value="Nurture">● Nurture</option>
                            </select>
                          </td>
                          <td>
                            <div className={styles.actionBtnGroup}>
                              <button onClick={() => setSelectedLead(lead)} className={styles.btnActionView} title="View Details" aria-label={`View details for lead ${lead.name}`}>
                                👁️
                              </button>
                              <button onClick={() => handleDeleteLead(lead._id)} className={styles.btnActionDelete} title="Delete Lead" aria-label={`Delete lead ${lead.name}`}>
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <Pagination 
                currentPage={leadsPage}
                totalPages={totalLeadsPages}
                onPageChange={setLeadsPage}
                totalItems={filteredLeads.length}
                itemsPerPage={LEADS_PER_PAGE}
                itemLabel="leads"
              />
            </div>
          )
        )}

        {/* TAB: Client Requirements Review & Sourcing Desk */}
        {activeTab === 'requirements' && (
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>Client Talent Requirements & Sourcing Desk</h3>
                <p className={styles.cardSub} style={{ margin: '0.25rem 0 0 0' }}>
                  Manage inbound hiring requests from enterprise clients, match verified Scrizian talent, and update fulfillment stages.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800 }}>
                  Total: {adminRequirements.length}
                </span>
                <span style={{ background: '#FEF3C7', color: '#92400E', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800 }}>
                  Active Sourcing: {adminRequirements.filter(r => r.status === 'Active Sourcing' || r.status === 'Reviewing' || r.status === 'Submitted').length}
                </span>
                <span style={{ background: '#DCFCE7', color: '#166534', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800 }}>
                  Fulfilled: {adminRequirements.filter(r => r.status === 'Fulfilled' || r.status === 'In Progress').length}
                </span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
              <div style={{ flex: '1 1 280px', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="🔍 Search requirements by role, tech stack, company or client..."
                  value={reqSearch}
                  onChange={e => setReqSearch(e.target.value)}
                  className={styles.formInput}
                  style={{ width: '100%', padding: '0.55rem 0.85rem' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Filter Status:</label>
                <select
                  value={reqStatusFilter}
                  onChange={e => setReqStatusFilter(e.target.value)}
                  className={styles.formSelect}
                  style={{ width: 'auto', padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Reviewing">Reviewing</option>
                  <option value="Active Sourcing">Active Sourcing</option>
                  <option value="Talent Shortlisted">Talent Shortlisted</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Fulfilled">Fulfilled</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Requirements Data Table */}
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Req ID</th>
                    <th>Client / Organization</th>
                    <th>Role & Model</th>
                    <th>Tech Stack</th>
                    <th>Headcount & Budget</th>
                    <th>Timeline / Overlap</th>
                    <th>Sourcing Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminRequirements
                    .filter(req => {
                      if (reqStatusFilter !== 'All' && (req.status || 'Submitted') !== reqStatusFilter) return false;
                      if (!reqSearch.trim()) return true;
                      const q = reqSearch.toLowerCase();
                      const role = (req.roleTitle || req.serviceRequested || '').toLowerCase();
                      const company = (req.company || req.client?.company || req.client?.name || req.clientEmail || '').toLowerCase();
                      const skills = (Array.isArray(req.skills) ? req.skills.join(' ') : req.techStack || '').toLowerCase();
                      return role.includes(q) || company.includes(q) || skills.includes(q);
                    })
                    .map((req, idx) => {
                      const reqId = req._id ? req._id.slice(-6).toUpperCase() : `REQ-${101 + idx}`;
                      const clientName = req.client?.company || req.company || req.client?.name || req.clientEmail || 'Enterprise Client';
                      const roleTitle = req.roleTitle || req.serviceRequested || 'Custom Talent Requirement';
                      const stack = Array.isArray(req.skills) && req.skills.length > 0 ? req.skills.join(', ') : (req.techStack || 'Full-Stack');
                      const openings = req.headcount || req.openings || 1;
                      const budgetStr = req.budget ? `$${req.budget}/mo` : (req.rateRange || 'Negotiable');
                      const currentStatus = req.status || 'Submitted';

                      let badgeBg = '#FEF3C7';
                      let badgeColor = '#92400E';
                      if (currentStatus === 'Fulfilled' || currentStatus === 'In Progress') {
                        badgeBg = '#DCFCE7';
                        badgeColor = '#166534';
                      } else if (currentStatus === 'Active Sourcing' || currentStatus === 'Talent Shortlisted') {
                        badgeBg = '#EFF6FF';
                        badgeColor = '#1D4ED8';
                      } else if (currentStatus === 'Closed') {
                        badgeBg = '#F1F5F9';
                        badgeColor = '#64748B';
                      }

                      return (
                        <tr key={req._id || idx}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 800, color: '#E52B2B' }}>
                            #{reqId}
                          </td>
                          <td>
                            <strong style={{ color: '#0F172A', fontSize: '0.92rem' }}>{clientName}</strong>
                            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                              {req.client?.email || req.clientEmail || 'client@scrizians.com'}
                            </div>
                          </td>
                          <td>
                            <strong>{roleTitle}</strong>
                            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                              {req.seniority || 'Senior'} • {req.engagementModel || req.roleType || 'Staff Augmentation'}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 600 }}>
                              {stack}
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: '#0F172A' }}>{openings} {openings > 1 ? 'Openings' : 'Opening'}</strong>
                            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{budgetStr}</div>
                          </td>
                          <td>
                            <span style={{ background: '#F1F5F9', color: '#475569', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                              {req.timeline || req.timezoneOverlap || 'Immediate / 4h Overlap'}
                            </span>
                          </td>
                          <td>
                            <select
                              value={currentStatus}
                              onChange={(e) => handleReviewRequirement(req._id, e.target.value)}
                              style={{
                                background: badgeBg,
                                color: badgeColor,
                                border: '1px solid transparent',
                                padding: '0.3rem 0.6rem',
                                borderRadius: '12px',
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="Submitted">● Submitted</option>
                              <option value="Reviewing">● Reviewing</option>
                              <option value="Active Sourcing">● Active Sourcing</option>
                              <option value="Talent Shortlisted">● Talent Shortlisted</option>
                              <option value="In Progress">● In Progress</option>
                              <option value="Fulfilled">● Fulfilled</option>
                              <option value="Closed">● Closed</option>
                            </select>
                          </td>
                          <td>
                            <div className={styles.actionBtnGroup}>
                              <button
                                type="button"
                                onClick={() => setSelectedReqForModal(req)}
                                className={styles.btnActionEdit}
                                title="View Full Details"
                              >
                                👁️ Details
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRequirement(req._id)}
                                className={styles.btnActionDelete}
                                title="Delete Requirement"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {adminRequirements.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>No Client Requirements Found</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.3rem' }}>
                          Client talent requests will appear here once submitted from client dashboards.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Requirement Details Modal */}
            {selectedReqForModal && (
              <div className={styles.modalOverlay} onClick={() => setSelectedReqForModal(null)}>
                <div className={styles.modalContent} style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
                  <button 
                    type="button" 
                    className={styles.modalClose} 
                    onClick={() => setSelectedReqForModal(null)}
                    aria-label="Close modal"
                  >
                    ✕
                  </button>

                  <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        CLIENT REQUIREMENT SPECIFICATION
                      </span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.8rem', color: '#64748B' }}>
                        #{selectedReqForModal._id ? selectedReqForModal._id.slice(-6).toUpperCase() : 'REQ'}
                      </span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0F172A' }}>
                      {selectedReqForModal.roleTitle || selectedReqForModal.serviceRequested || 'Talent Requirement'}
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, display: 'block' }}>CLIENT / COMPANY</span>
                      <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>
                        {selectedReqForModal.client?.company || selectedReqForModal.company || selectedReqForModal.client?.name || selectedReqForModal.clientEmail || 'Client'}
                      </strong>
                      <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                        {selectedReqForModal.client?.email || selectedReqForModal.clientEmail || '—'}
                      </div>
                    </div>

                    <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, display: 'block' }}>HEADCOUNT & BUDGET</span>
                      <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>
                        {selectedReqForModal.headcount || selectedReqForModal.openings || 1} Positions
                      </strong>
                      <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 700 }}>
                        {selectedReqForModal.budget ? `$${selectedReqForModal.budget}/mo` : 'Negotiable'}
                      </div>
                    </div>

                    <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, display: 'block' }}>TIMEZONE OVERLAP & MODEL</span>
                      <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>
                        {selectedReqForModal.engagementModel || 'Staff Augmentation'}
                      </strong>
                      <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                        {selectedReqForModal.timezoneOverlap || selectedReqForModal.timeline || 'Flexible'}
                      </div>
                    </div>

                    <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, display: 'block' }}>STATUS</span>
                      <select
                        value={selectedReqForModal.status || 'Submitted'}
                        onChange={(e) => {
                          handleReviewRequirement(selectedReqForModal._id, e.target.value);
                          setSelectedReqForModal({ ...selectedReqForModal, status: e.target.value });
                        }}
                        style={{
                          marginTop: '0.25rem',
                          width: '100%',
                          padding: '0.35rem 0.5rem',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          fontWeight: 800,
                          fontSize: '0.8rem'
                        }}
                      >
                        <option value="Submitted">Submitted</option>
                        <option value="Reviewing">Reviewing</option>
                        <option value="Active Sourcing">Active Sourcing</option>
                        <option value="Talent Shortlisted">Talent Shortlisted</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Fulfilled">Fulfilled</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>
                      Required Tech Stack & Skills:
                    </h4>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {(Array.isArray(selectedReqForModal.skills) ? selectedReqForModal.skills : (selectedReqForModal.techStack || 'Full-Stack, JavaScript, React, Node.js').split(',')).map((sk: string, i: number) => (
                        <span key={i} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#334155', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                          {sk.trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedReqForModal.description && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>
                        Requirement Scope & Description:
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: 1.6, background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        {selectedReqForModal.description}
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
                    <button
                      type="button"
                      onClick={() => handleDeleteRequirement(selectedReqForModal._id)}
                      className={styles.btnSecondary}
                      style={{ color: '#DC2626', borderColor: '#FECACA' }}
                    >
                      🗑️ Delete Request
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedReqForModal(null)}
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

        {/* TAB 2: Scrizian Talent Directory with Avatars */}
        {(activeTab === 'talent' || activeTab === 'employees') && (
          showTalentModal ? (
            <div className={styles.card}>
              <button 
                type="button" 
                onClick={() => setShowTalentModal(false)}
                className={styles.btnBack}
              >
                ← Back to Talent Roster
              </button>
              <div style={{ marginBottom: '1.5rem', paddingBottom: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>
                  {editingTalent ? '✏️ Edit Scrizian Profile' : '➕ Add New Scrizian Profile'}
                </h3>
                <p className={styles.cardSub} style={{ margin: '0.2rem 0 0 0' }}>ID: {talentFormData.id}</p>
              </div>

              <form onSubmit={handleSaveTalent} style={{ maxWidth: '680px' }}>
                <div className={styles.formGroup}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Profile Avatar / Photo Upload:
                  </label>
                  <div className={styles.imageUploadBox}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], url => setTalentFormData({ ...talentFormData, avatarUrl: url }))}
                      style={{ display: 'none' }}
                      id="talent-photo-input"
                    />
                    <label htmlFor="talent-photo-input" style={{ cursor: 'pointer', margin: 0 }}>
                      📁 Click or Drag Image to Upload Photo
                    </label>
                    {talentFormData.avatarUrl && (
                      <div className={styles.imagePreviewRow}>
                        <img src={talentFormData.avatarUrl} alt="Preview" className={styles.imagePreview} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                        <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 800 }}>✓ Avatar Preview Loaded</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Display Name (Privacy First format e.g. Aarav M.): *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Rahul S. (Lead Fullstack Dev)" 
                    value={talentFormData.displayName}
                    onChange={e => setTalentFormData({ ...talentFormData, displayName: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Professional Title: *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Senior React & Node.js Developer" 
                    value={talentFormData.title}
                    onChange={e => setTalentFormData({ ...talentFormData, title: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.gridTwoCols}>
                  <div className={styles.formGroup}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                      Hourly Rate ($ USD):
                    </label>
                    <input 
                      type="number" 
                      value={talentFormData.hourlyRateUSD}
                      onChange={e => setTalentFormData({ ...talentFormData, hourlyRateUSD: e.target.value })}
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                      Availability:
                    </label>
                    <select 
                      value={talentFormData.availability}
                      onChange={e => setTalentFormData({ ...talentFormData, availability: e.target.value })}
                      className={styles.formSelect}
                    >
                      <option value="Immediate">Immediate</option>
                      <option value="1-2 Weeks">1-2 Weeks</option>
                      <option value="1 Month">1 Month</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Key Skills:
                  </label>
                  <input 
                    type="text" 
                    placeholder="React, Next.js, Node.js, AWS" 
                    value={talentFormData.skills}
                    onChange={e => setTalentFormData({ ...talentFormData, skills: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem' }}>
                  <button type="submit" className={styles.btnPrimaryAction}>
                    ✓ {editingTalent ? 'Save Changes' : 'Create & Publish Profile'}
                  </button>
                  <button type="button" onClick={() => setShowTalentModal(false)} className={styles.btnCancelAction}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.2rem' }}>
                <div>
                  <h3 className={styles.cardTitle} style={{ margin: 0 }}>Verified Scrizian Talent Roster</h3>
                  <p className={styles.cardSub} style={{ margin: '0.2rem 0 0 0' }}>
                    Manage engineers and specialists. Click Edit to update profile photo, skills, or rates.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    placeholder="Search talent..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className={styles.formInput}
                    style={{ maxWidth: '220px', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
                  />
                  <button onClick={handleOpenAddTalent} className={styles.btnPrimaryAction}>
                    + Add New Scrizian
                  </button>
                </div>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Scrizian ID</th>
                      <th>Name & Title</th>
                      <th>Hourly Rate</th>
                      <th>Availability</th>
                      <th>Verification Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTalents.map(talent => (
                      <tr key={talent.id}>
                        <td>
                          <img 
                            src={talent.avatarUrl || '/images/logo.png'} 
                            alt="Avatar" 
                            className={styles.tableImage}
                          />
                        </td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 800 }}>{talent.id}</td>
                        <td>
                          <strong>{talent.displayName}</strong><br/>
                          <span className={styles.subText}>{talent.title}</span>
                        </td>
                        <td><strong style={{ color: '#0B172A' }}>${talent.hourlyRateUSD} / hr</strong></td>
                        <td>{talent.availability}</td>
                        <td>
                          <select 
                            value={talent.status === 'Verified' || talent.status === 'approved' ? 'Verified' : (talent.status === 'changes_requested' ? 'Changes Requested' : (talent.status === 'rejected' ? 'Rejected' : (talent.status === 'in_review' ? 'In Review' : 'Pending Review')))}
                            onChange={e => handleToggleVerifyTalent(talent.id, e.target.value)}
                            className={styles.selectStatus}
                            aria-label={`Verification status for ${talent.displayName}`}
                          >
                            <option value="Verified">✓ Verified Scrizian</option>
                            <option value="Pending Review">⏳ Pending Review</option>
                            <option value="In Review">🔍 In Review</option>
                            <option value="Changes Requested">⚠️ Changes Requested</option>
                            <option value="Rejected">❌ Rejected</option>
                          </select>
                        </td>
                        <td>
                          <div className={styles.actionBtnGroup}>
                            <button onClick={() => handleOpenEditTalent(talent)} className={styles.btnActionEdit} title="Edit Profile" aria-label={`Edit ${talent.displayName}`}>
                              ✏️
                            </button>
                            <button onClick={() => handleDeleteTalent(talent.id)} className={styles.btnActionDelete} title="Delete Profile" aria-label={`Delete ${talent.displayName}`}>
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination 
                currentPage={talentPage}
                totalPages={totalTalentPages}
                onPageChange={setTalentPage}
                totalItems={talents.length}
                itemsPerPage={TALENT_PER_PAGE}
                itemLabel="talent profiles"
              />
            </div>
          )
        )}

        {/* TAB 3: Job Openings Table with Company Logos */}
        {activeTab === 'jobs' && (
          showJobModal ? (
            <div className={styles.card}>
              <button 
                type="button" 
                onClick={() => setShowJobModal(false)}
                className={styles.btnBack}
              >
                ← Back to Job Workflows
              </button>
              <div style={{ marginBottom: '1.5rem', paddingBottom: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>
                  {editingJob ? '✏️ Edit Job Opening' : '➕ Post New Job Opening'}
                </h3>
                <p className={styles.cardSub} style={{ margin: '0.2rem 0 0 0' }}>ID: {jobFormData.id}</p>
              </div>

              <form onSubmit={handleSaveJob} style={{ maxWidth: '680px' }}>
                <div className={styles.formGroup}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Client Company Logo Upload:
                  </label>
                  <div className={styles.imageUploadBox}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], url => setJobFormData({ ...jobFormData, companyLogoUrl: url }))}
                      style={{ display: 'none' }}
                      id="job-logo-input"
                    />
                    <label htmlFor="job-logo-input" style={{ cursor: 'pointer', margin: 0 }}>
                      📁 Click or Drag Image to Upload Company Logo
                    </label>
                    {jobFormData.companyLogoUrl && (
                      <div className={styles.imagePreviewRow}>
                        <img src={jobFormData.companyLogoUrl} alt="Preview" className={styles.imagePreview} style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                        <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 800 }}>✓ Logo Preview Loaded</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Job Title: *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Lead Flutter & Mobile Architect" 
                    value={jobFormData.title}
                    onChange={e => setJobFormData({ ...jobFormData, title: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Client / Company Name:
                  </label>
                  <input 
                    type="text" 
                    value={jobFormData.company}
                    onChange={e => setJobFormData({ ...jobFormData, company: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.gridTwoCols}>
                  <div className={styles.formGroup}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                      Location:
                    </label>
                    <input 
                      type="text" 
                      value={jobFormData.location}
                      onChange={e => setJobFormData({ ...jobFormData, location: e.target.value })}
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                      Rate / Budget Range:
                    </label>
                    <input 
                      type="text" 
                      value={jobFormData.rate}
                      onChange={e => setJobFormData({ ...jobFormData, rate: e.target.value })}
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem' }}>
                  <button type="submit" className={styles.btnPrimaryAction}>
                    ✓ {editingJob ? 'Save Changes' : 'Post Job Opening'}
                  </button>
                  <button type="button" onClick={() => setShowJobModal(false)} className={styles.btnCancelAction}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.2rem' }}>
                <div>
                  <h3 className={styles.cardTitle} style={{ margin: 0 }}>Active Client Hiring Postings</h3>
                  <p className={styles.cardSub} style={{ margin: '0.2rem 0 0 0' }}>
                    Manage live job postings displayed on the jobs board with company logos.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    placeholder="Search jobs..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className={styles.formInput}
                    style={{ maxWidth: '220px', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
                  />
                  <button onClick={handleOpenAddJob} className={styles.btnPrimaryAction}>
                    + Post Job Opening
                  </button>
                </div>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Logo</th>
                      <th>Job ID</th>
                      <th>Title & Client</th>
                      <th>Location</th>
                      <th>Rate Range</th>
                      <th>Applicants</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedJobs.map(job => (
                      <tr key={job.id}>
                        <td>
                          <img 
                            src={job.companyLogoUrl || '/images/logo.png'} 
                            alt="Logo" 
                            className={styles.tableImage}
                          />
                        </td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 800 }}>{job.id}</td>
                        <td>
                          <strong>{job.title}</strong><br/>
                          <span className={styles.subText}>{job.company}</span>
                        </td>
                        <td>{job.location}</td>
                        <td><strong>{job.rate}</strong></td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleOpenJobApplicants(job)}
                            style={{
                              background: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              color: '#1D4ED8',
                              fontWeight: 800,
                              borderRadius: '6px',
                              padding: '0.25rem 0.6rem',
                              cursor: 'pointer',
                              fontSize: '0.78rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                            title="View candidate applications pipeline"
                          >
                            👥 {job.applicantsCount} Applicants
                          </button>
                        </td>
                        <td>
                          <span style={{ whiteSpace: 'nowrap', fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>
                            ● {job.status}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionBtnGroup}>
                            <button
                              type="button"
                              onClick={() => handleOpenJobApplicants(job)}
                              style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '0.35rem 0.65rem', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                              title="Review Candidates"
                            >
                              👥 Applicants
                            </button>
                            <button 
                              onClick={() => handleToggleJobStatus(job.id)} 
                              style={{ background: (job.status === 'Active' || job.status === 'Verified') ? '#DCFCE7' : '#FEF3C7', color: (job.status === 'Active' || job.status === 'Verified') ? '#166534' : '#92400E', padding: '0.35rem 0.65rem', borderRadius: '4px', border: 'none', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                              title="Toggle Job Status"
                            >
                              {(job.status === 'Active' || job.status === 'Verified') ? '✓ Active' : '⚡ Activate'}
                            </button>
                            <button onClick={() => handleOpenEditJob(job)} className={styles.btnActionEdit} title="Edit Job">
                              ✏️
                            </button>
                            <button onClick={() => handleDeleteJob(job.id)} className={styles.btnActionDelete} title="Delete Job">
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination 
                currentPage={jobsPage}
                totalPages={totalJobsPages}
                onPageChange={setJobsPage}
                totalItems={jobs.length}
                itemsPerPage={JOBS_PER_PAGE}
                itemLabel="job openings"
              />

              {/* Applicants Pipeline Modal */}
              {selectedJobForApplicants && (
                <div className={styles.modalOverlay} onClick={() => setSelectedJobForApplicants(null)}>
                  <div className={styles.modalContent} style={{ maxWidth: '850px' }} onClick={e => e.stopPropagation()}>
                    <button 
                      type="button" 
                      className={styles.modalClose} 
                      onClick={() => setSelectedJobForApplicants(null)}
                      aria-label="Close modal"
                    >
                      ✕
                    </button>

                    <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                        <span style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          JOB APPLICANTS PIPELINE
                        </span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.8rem', color: '#64748B' }}>
                          ID: {selectedJobForApplicants.id}
                        </span>
                      </div>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                        {selectedJobForApplicants.title}
                      </h3>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                        {selectedJobForApplicants.company} • {selectedJobForApplicants.location} • {jobApplicantsList.length} Total Applicants
                      </p>
                    </div>

                    {loadingApplicants ? (
                      <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748B' }}>
                        Loading applicants pipeline...
                      </div>
                    ) : jobApplicantsList.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2.5rem', background: '#F8FAFC', borderRadius: '10px', border: '1px dashed #CBD5E1' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                        <div style={{ fontWeight: 800, color: '#0F172A' }}>No Applicants Yet</div>
                        <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>
                          Candidates applying to this job post will appear here in real-time.
                        </p>
                      </div>
                    ) : (
                      <div className={styles.tableContainer} style={{ maxHeight: '420px', overflowY: 'auto' }}>
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th>Candidate</th>
                              <th>Applied Date</th>
                              <th>Resume / Details</th>
                              <th>Current Stage</th>
                              <th>Update Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {jobApplicantsList.map((app: any) => {
                              const candidateName = app.candidate?.name || app.fullName || 'Candidate';
                              const candidateEmail = app.candidate?.email || app.email || '—';
                              const candidateId = app.candidate?.scrizianId || (app.candidate?._id ? app.candidate._id.slice(-6).toUpperCase() : '—');
                              const appDate = app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'Recent';
                              return (
                                <tr key={app._id}>
                                  <td>
                                    <strong style={{ color: '#0F172A' }}>{candidateName}</strong>
                                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{candidateEmail}</div>
                                    <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#E52B2B' }}>{candidateId}</div>
                                  </td>
                                  <td>
                                    <span style={{ fontSize: '0.82rem', color: '#475569' }}>{appDate}</span>
                                  </td>
                                  <td>
                                    {app.resumeUrl ? (
                                      <a
                                        href={app.resumeUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.3rem',
                                          fontSize: '0.78rem',
                                          color: '#1D4ED8',
                                          fontWeight: 700,
                                          textDecoration: 'underline'
                                        }}
                                      >
                                        📄 View Resume
                                      </a>
                                    ) : (
                                      <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>In Profile</span>
                                    )}
                                    {app.coverLetter && (
                                      <div style={{ fontSize: '0.75rem', color: '#64748B', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {app.coverLetter}
                                      </div>
                                    )}
                                  </td>
                                  <td>
                                    <span style={{
                                      background: app.status === 'Selected' || app.status === 'Offered' || app.status === 'Joined' ? '#DCFCE7' :
                                        app.status === 'Rejected' || app.status === 'Withdrawn' ? '#FEE2E2' :
                                        app.status === 'Interview' || app.status === 'Interview Scheduled' ? '#EDE9FE' : '#EFF6FF',
                                      color: app.status === 'Selected' || app.status === 'Offered' || app.status === 'Joined' ? '#166534' :
                                        app.status === 'Rejected' || app.status === 'Withdrawn' ? '#991B1B' :
                                        app.status === 'Interview' || app.status === 'Interview Scheduled' ? '#6B21A8' : '#1D4ED8',
                                      padding: '0.25rem 0.6rem',
                                      borderRadius: '12px',
                                      fontWeight: 800,
                                      fontSize: '0.75rem',
                                      display: 'inline-block'
                                    }}>
                                      ● {app.status || 'Applied'}
                                    </span>
                                  </td>
                                  <td>
                                    <select
                                      value={app.status || 'Applied'}
                                      onChange={(e) => handleUpdateApplicantStatus(app._id, e.target.value)}
                                      style={{
                                        padding: '0.3rem 0.5rem',
                                        borderRadius: '6px',
                                        border: '1px solid #CBD5E1',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        background: '#ffffff',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <option value="Applied">Applied</option>
                                      <option value="Screening">Screening</option>
                                      <option value="Shortlisted">Shortlisted</option>
                                      <option value="Interview">Interview</option>
                                      <option value="Selected">Selected</option>
                                      <option value="Offered">Offered</option>
                                      <option value="Joined">Joined</option>
                                      <option value="Rejected">Rejected</option>
                                    </select>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* TAB 4: Insights & Articles Table with Banners */}
        {activeTab === 'insights' && (
          showInsightModal ? (
            <div className={styles.card}>
              <button 
                type="button" 
                onClick={() => setShowInsightModal(false)}
                className={styles.btnBack}
              >
                ← Back to Articles
              </button>
              <div style={{ marginBottom: '1.5rem', paddingBottom: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>
                  {editingInsight ? '✏️ Edit Published Article' : '➕ Create & Publish Article'}
                </h3>
                <p className={styles.cardSub} style={{ margin: '0.2rem 0 0 0' }}>ID: {insightFormData.id}</p>
              </div>

              <form onSubmit={handleSaveInsight} style={{ maxWidth: '680px' }}>
                <div className={styles.formGroup}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Article Cover Banner Upload:
                  </label>
                  <div className={styles.imageUploadBox}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], url => setInsightFormData({ ...insightFormData, coverImageUrl: url }))}
                      style={{ display: 'none' }}
                      id="insight-cover-input"
                    />
                    <label htmlFor="insight-cover-input" style={{ cursor: 'pointer', margin: 0 }}>
                      📁 Click or Drag Image to Upload Cover Banner
                    </label>
                    {insightFormData.coverImageUrl && (
                      <div className={styles.imagePreviewRow}>
                        <img src={insightFormData.coverImageUrl} alt="Preview" className={styles.imagePreview} style={{ width: '100px', height: '60px', objectFit: 'cover' }} />
                        <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 800 }}>✓ Cover Preview Loaded</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Article Title: *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Scaling Next.js Applications for High Traffic" 
                    value={insightFormData.title}
                    onChange={e => setInsightFormData({ ...insightFormData, title: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.gridTwoCols}>
                  <div className={styles.formGroup}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                      Category:
                    </label>
                    <select 
                      value={insightFormData.category}
                      onChange={e => setInsightFormData({ ...insightFormData, category: e.target.value })}
                      className={styles.formSelect}
                    >
                      <option value="Hiring Guides">Hiring Guides</option>
                      <option value="SaaS Engineering">SaaS Engineering</option>
                      <option value="Engineering Management">Engineering Management</option>
                      <option value="Cloud & DevOps">Cloud & DevOps</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                      Author Attribution:
                    </label>
                    <input 
                      type="text" 
                      value={insightFormData.author}
                      onChange={e => setInsightFormData({ ...insightFormData, author: e.target.value })}
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem' }}>
                  <button type="submit" className={styles.btnPrimaryAction}>
                    ✓ {editingInsight ? 'Save Changes' : 'Publish Article'}
                  </button>
                  <button type="button" onClick={() => setShowInsightModal(false)} className={styles.btnCancelAction}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.2rem' }}>
                <div>
                  <h3 className={styles.cardTitle} style={{ margin: 0 }}>Published Insights & Technical Articles</h3>
                  <p className={styles.cardSub} style={{ margin: '0.2rem 0 0 0' }}>
                    Manage community articles and guides published on `/insights` with cover images.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    placeholder="Search articles..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className={styles.formInput}
                    style={{ maxWidth: '220px', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
                  />
                  <button onClick={handleOpenAddInsight} className={styles.btnPrimaryAction}>
                    + Create Article
                  </button>
                </div>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Cover Banner</th>
                      <th>Article Title</th>
                      <th>Category</th>
                      <th>Author Attribution</th>
                      <th>Read Time</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedInsights.map(art => (
                      <tr key={art.id}>
                        <td>
                          <img 
                            src={art.coverImageUrl || '/images/logo.png'} 
                            alt="Cover" 
                            className={styles.tableImage}
                            style={{ width: '60px', height: '40px' }}
                          />
                        </td>
                        <td>
                          <strong>{art.title}</strong><br/>
                          <span className={styles.subText} style={{ whiteSpace: 'nowrap' }}>Published: {art.publishedDate}</span>
                        </td>
                        <td><span style={{ whiteSpace: 'nowrap', fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>{art.category}</span></td>
                        <td><strong>{art.author}</strong></td>
                        <td style={{ whiteSpace: 'nowrap' }}>{art.readTime}</td>
                        <td>
                          <span style={{ whiteSpace: 'nowrap', fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>
                            ✓ {art.status}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionBtnGroup}>
                            <button 
                              onClick={() => handleToggleApproveArticle(art.id)} 
                              style={{ background: art.status === 'Published' ? '#DCFCE7' : '#FEF3C7', color: art.status === 'Published' ? '#166534' : '#92400E', padding: '0.35rem 0.65rem', borderRadius: '4px', border: 'none', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                              title="Toggle Publication Status"
                            >
                              {art.status === 'Published' ? '✓ Live' : '⚡ Publish'}
                            </button>
                            <button onClick={() => handleOpenEditInsight(art)} className={styles.btnActionEdit} title="Edit Article">
                              ✏️
                            </button>
                            <button onClick={() => handleDeleteInsight(art.id)} className={styles.btnActionDelete} title="Delete Article">
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination 
                currentPage={insightsPage}
                totalPages={totalInsightsPages}
                onPageChange={setInsightsPage}
                totalItems={insights.length}
                itemsPerPage={INSIGHTS_PER_PAGE}
                itemLabel="published articles"
              />
            </div>
          )
        )}

        {/* TAB: Portfolio Showcase & Projects */}
        {activeTab === 'portfolio' && (
          showPortfolioModal ? (
            <div className={styles.card}>
              <button 
                type="button" 
                onClick={() => setShowPortfolioModal(false)}
                className={styles.btnBack}
              >
                ← Back to Portfolio Showcase
              </button>
              <div style={{ marginBottom: '1.5rem', paddingBottom: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>
                  {editingPortfolio ? '✏️ Edit Portfolio Showcase Project' : '➕ Add New Portfolio Showcase Project'}
                </h3>
                <p className={styles.cardSub} style={{ margin: '0.2rem 0 0 0' }}>ID: {portfolioFormData.id}</p>
              </div>

              <form onSubmit={handleSavePortfolio} style={{ maxWidth: '680px' }}>
                <div className={styles.formGroup}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Project Showcase Title *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Enterprise Lending Platform Re-architecture"
                    value={portfolioFormData.title} 
                    onChange={e => setPortfolioFormData({ ...portfolioFormData, title: e.target.value })}
                    className={styles.formInput} 
                  />
                </div>

                <div className={styles.gridTwoCols}>
                  <div className={styles.formGroup}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                      Scrizian ID Reference *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. SCR-8841"
                      value={portfolioFormData.scrizianId} 
                      onChange={e => setPortfolioFormData({ ...portfolioFormData, scrizianId: e.target.value })}
                      className={styles.formInput} 
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                      Author / Lead Role *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Lead Solutions Architect"
                      value={portfolioFormData.authorRole} 
                      onChange={e => setPortfolioFormData({ ...portfolioFormData, authorRole: e.target.value })}
                      className={styles.formInput} 
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Project Cover Image / Banner Upload:
                  </label>
                  <div className={styles.imageUploadBox}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], url => setPortfolioFormData({ ...portfolioFormData, coverImageUrl: url }))}
                      style={{ display: 'none' }}
                      id="portfolio-cover-input"
                    />
                    <label htmlFor="portfolio-cover-input" style={{ cursor: 'pointer', margin: 0 }}>
                      📁 Click or Drag Image to Upload Project Banner
                    </label>
                    {portfolioFormData.coverImageUrl && (
                      <div className={styles.imagePreviewRow}>
                        <img src={portfolioFormData.coverImageUrl} alt="Preview" className={styles.imagePreview} style={{ width: '100px', height: '60px', objectFit: 'cover' }} />
                        <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 800 }}>✓ Banner Preview Loaded</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Technologies / Tech Stack (comma separated):
                  </label>
                  <input 
                    type="text" 
                    placeholder="Next.js, Node.js, AWS, Kafka"
                    value={portfolioFormData.skills} 
                    onChange={e => setPortfolioFormData({ ...portfolioFormData, skills: e.target.value })}
                    className={styles.formInput} 
                  />
                </div>

                <div className={styles.formGroup}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Project Summary / Architecture Description *
                  </label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Detailed description of project architecture, impact, and deliverables..."
                    value={portfolioFormData.description} 
                    onChange={e => setPortfolioFormData({ ...portfolioFormData, description: e.target.value })}
                    className={styles.formTextarea} 
                  />
                </div>

                <div className={styles.formGroup} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    id="ndaCheckbox"
                    checked={portfolioFormData.isNdaProtected} 
                    onChange={e => setPortfolioFormData({ ...portfolioFormData, isNdaProtected: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="ndaCheckbox" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0F172A', cursor: 'pointer' }}>
                    🔒 Mark as NDA Protected Case Study
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem' }}>
                  <button type="submit" className={styles.btnPrimaryAction}>
                    ✓ {editingPortfolio ? 'Save Changes' : 'Publish Portfolio Showcase'}
                  </button>
                  <button type="button" className={styles.btnCancelAction} onClick={() => setShowPortfolioModal(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.2rem' }}>
                <div>
                  <h3 className={styles.cardTitle} style={{ margin: 0 }}>🎨 Portfolio Showcase & Case Studies</h3>
                  <p className={styles.cardSub} style={{ margin: '0.2rem 0 0 0' }}>
                    Manage client-ready project architecture showcases and NDA-protected case studies displayed across `/portfolio` and Talent Profiles.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    placeholder="Search showcase projects..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className={styles.formInput}
                    style={{ maxWidth: '220px', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
                  />
                  <button onClick={handleOpenAddPortfolio} className={styles.btnPrimaryAction}>
                    + Add Showcase Project
                  </button>
                </div>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Cover Banner</th>
                      <th>Project Title & ID</th>
                      <th>Scrizian / Role</th>
                      <th>Description</th>
                      <th>Tech Stack</th>
                      <th>Visibility / NDA</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPortfolios.map(p => (
                      <tr key={p.id || p._id}>
                        <td>
                          <img 
                            src={p.coverImageUrl || '/images/logo.png'} 
                            alt="Banner" 
                            className={styles.tableImage}
                            style={{ width: '60px', height: '40px', objectFit: 'cover' }}
                          />
                        </td>
                        <td>
                          <strong>{p.title}</strong><br/>
                          <span className={styles.subText} style={{ whiteSpace: 'nowrap' }}>ID: {p.id}</span>
                        </td>
                        <td>
                          <strong>{p.scrizianId}</strong><br/>
                          <span className={styles.subText}>{p.authorRole}</span>
                        </td>
                        <td style={{ maxWidth: '240px', fontSize: '0.85rem', color: '#475569' }}>
                          {p.description}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', maxWidth: '180px' }}>
                            {(Array.isArray(p.skills) ? p.skills : (p.skills ? p.skills.split(',') : [])).map((s: string, idx: number) => (
                              <span key={idx} className={styles.skillBadge} style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}>{s.trim()}</span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <button 
                            onClick={() => handleToggleNdaPortfolio(p)}
                            style={{ 
                              background: p.isNdaProtected ? '#FEF3C7' : '#DCFCE7', 
                              color: p.isNdaProtected ? '#92400E' : '#166534', 
                              padding: '0.3rem 0.6rem', 
                              borderRadius: '12px', 
                              border: 'none', 
                              fontSize: '0.75rem', 
                              fontWeight: 800, 
                              cursor: 'pointer', 
                              whiteSpace: 'nowrap' 
                            }}
                          >
                            {p.isNdaProtected ? '🔒 NDA Protected' : '🟢 Public Showcase'}
                          </button>
                        </td>
                        <td>
                          <div className={styles.actionBtnGroup}>
                            <button onClick={() => handleOpenEditPortfolio(p)} className={styles.btnActionEdit} title="Edit Project Showcase">
                              ✏️
                            </button>
                            <button onClick={() => handleDeletePortfolio(p.id || p._id)} className={styles.btnActionDelete} title="Delete Showcase">
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paginatedPortfolios.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                          No portfolio showcase projects found matching "{searchTerm}".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination 
                currentPage={portfolioPage}
                totalPages={totalPortfolioPages}
                onPageChange={setPortfolioPage}
                totalItems={filteredPortfolios.length}
                itemsPerPage={PORTFOLIO_PER_PAGE}
                itemLabel="portfolio showcase projects"
              />
            </div>
          )
        )}

        {/* TAB 5: Platform Config & RBAC */}
        {activeTab === 'config' && (
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1.2rem' }}>
              <div>
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>Platform Configuration & Granular RBAC Permissions</h3>
                <p className={styles.cardSub} style={{ margin: '0.2rem 0 0 0' }}>
                  Manage system settings, role-based access rules (View/Create/Edit/Delete/Approve/Publish/Export/Assign), and user roles.
                </p>
              </div>
              <span className={styles.adminBadge}>RBAC SYSTEM ONLINE</span>
            </div>

            <div className={styles.gridTwoCols}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.2rem', borderRadius: '10px' }}>
                <h4 style={{ margin: '0 0 0.8rem 0', color: '#0F172A', fontSize: '1rem', fontWeight: 800 }}>🛡️ Mandatory 2FA & Session Security</h4>
                <div style={{ fontSize: '0.88rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <label><input type="checkbox" defaultChecked /> Require 2FA for all Super Admin logins (OTP / Authenticator App)</label>
                  <label><input type="checkbox" defaultChecked /> Enforce JWT Access Token + Refresh Token Rotation</label>
                  <label><input type="checkbox" defaultChecked /> Secure HttpOnly Cookie Sessions with Brute-Force Rate Limiting</label>
                  <label><input type="checkbox" defaultChecked /> Prevent Public Indexing of Sensitive Verification Documents</label>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.2rem', borderRadius: '10px' }}>
                <h4 style={{ margin: '0 0 0.8rem 0', color: '#0F172A', fontSize: '1rem', fontWeight: 800 }}>🔑 Active API Access Keys</h4>
                <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                  <p><strong>Primary Web Gateway Key:</strong> <span style={{ fontFamily: 'monospace', background: '#E2E8F0', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>szn_live_key_9988112233</span></p>
                  <p><strong>CRM Webhook Endpoint:</strong> <span style={{ fontFamily: 'monospace', background: '#E2E8F0', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>https://api.scrizians.com/v1/leads/inbound</span></p>
                  <button onClick={() => setNotification('🔑 API Keys rotated successfully!')} className={styles.btnPrimaryAction} style={{ marginTop: '0.5rem', fontSize: '0.82rem' }}>Rotate System API Keys</button>
                </div>
              </div>
            </div>

            {/* Granular User Role Management Table */}
            <div style={{ marginTop: '1.8rem' }}>
              {showUserForm ? (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.5rem', borderRadius: '12px' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowUserForm(false)}
                    className={styles.btnBack}
                  >
                    ← Back to System Users Table
                  </button>
                  <div style={{ marginBottom: '1.2rem', paddingBottom: '0.8rem', borderBottom: '1px solid #CBD5E1' }}>
                    <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                      {editingUser ? '✏️ Edit System User Account' : '➕ Add New System User Account'}
                    </h4>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                      Configure user identity, system role permissions, and avatar photo in MongoDB database.
                    </p>
                  </div>

                  <form onSubmit={handleSaveUser} style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Avatar Image Upload */}
                    <div className={styles.formGroup}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                        User Profile Avatar / Photo:
                      </label>
                      <div className={styles.imageUploadBox}>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], url => setUserFormData({ ...userFormData, avatar: url }))}
                          style={{ display: 'none' }}
                          id="user-avatar-input"
                        />
                        <label htmlFor="user-avatar-input" style={{ cursor: 'pointer', margin: 0 }}>
                          📁 Click or Drag Image to Upload User Avatar
                        </label>
                        {userFormData.avatar && (
                          <div className={styles.imagePreviewRow}>
                            <img src={userFormData.avatar} alt="Preview" className={styles.imagePreview} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} />
                            <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 800 }}>✓ Avatar Loaded</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>Full Name *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Priyanshu Sharma"
                        value={userFormData.name}
                        onChange={e => setUserFormData({ ...userFormData, name: e.target.value })}
                        className={styles.formInput}
                      />
                    </div>

                    <div className={styles.gridTwoCols}>
                      <div className={styles.formGroup}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>Email Address</label>
                        <input 
                          type="email" 
                          placeholder="e.g. user@scrizians.com"
                          value={userFormData.email}
                          onChange={e => setUserFormData({ ...userFormData, email: e.target.value })}
                          className={styles.formInput}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>Phone Number</label>
                        <input 
                          type="text" 
                          placeholder="e.g. +91 98765 43210"
                          value={userFormData.phone}
                          onChange={e => setUserFormData({ ...userFormData, phone: e.target.value })}
                          className={styles.formInput}
                        />
                      </div>
                    </div>

                    {!editingUser && (
                      <div className={styles.formGroup}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>Initial Password *</label>
                        <input 
                          type="password" 
                          required
                          placeholder="Minimum 8 characters"
                          value={userFormData.password}
                          onChange={e => setUserFormData({ ...userFormData, password: e.target.value })}
                          className={styles.formInput}
                        />
                      </div>
                    )}

                    <div className={styles.gridTwoCols}>
                      <div className={styles.formGroup}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>System Role *</label>
                        <select 
                          value={userFormData.role}
                          onChange={e => setUserFormData({ ...userFormData, role: e.target.value })}
                          className={styles.formSelect}
                        >
                          <option value="admin">Super Admin</option>
                          <option value="scriza_staff">Scriza Staff</option>
                          <option value="client">Client / Company</option>
                          <option value="scrizian">Scrizian Talent</option>
                          <option value="contributor">Content Author</option>
                          <option value="candidate">Job Candidate</option>
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>Designation / Title</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Senior Tech Lead / Enterprise Client"
                          value={userFormData.title}
                          onChange={e => setUserFormData({ ...userFormData, title: e.target.value })}
                          className={styles.formInput}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
                      <button type="submit" className={styles.btnPrimaryAction}>
                        💾 {editingUser ? 'Save User Changes' : 'Create User Account'}
                      </button>
                      <button type="button" onClick={() => setShowUserForm(false)} className={styles.btnCancelAction}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>👥 System User Accounts & RBAC Role Assignment</h4>
                      <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                        Manage roles, avatars, and permissions for registered users saved in MongoDB Atlas database.
                      </p>
                    </div>
                    <button onClick={handleOpenAddUser} className={styles.btnPrimaryAction}>
                      + Add New System User
                    </button>
                  </div>

                  <div className={styles.tableContainer}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Avatar</th>
                          <th>Scrizian ID / Email</th>
                          <th>Full Name</th>
                          <th>Current System Role</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.length > 0 ? (
                          usersList.map((usr: any) => (
                            <tr key={usr._id || usr.email}>
                              <td>
                                {usr.avatar ? (
                                  <img 
                                    src={usr.avatar} 
                                    alt={usr.name || 'User'} 
                                    style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#475569', fontSize: '0.85rem' }}>
                                    {(usr.name || usr.email || 'U').charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </td>
                              <td>
                                <strong style={{ color: '#0F172A' }}>{usr.email || usr.phone}</strong><br/>
                                <span style={{ fontSize: '0.78rem', color: '#E52B2B', fontFamily: 'monospace', fontWeight: 800 }}>
                                  {usr.scrizianId || usr.id || 'SZN-USER'}
                                </span>
                              </td>
                              <td>
                                <div><strong>{usr.name || 'Registered User'}</strong></div>
                                {usr.title && <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{usr.title}</div>}
                              </td>
                              <td>
                                <span style={{
                                  padding: '0.25rem 0.7rem',
                                  borderRadius: '12px',
                                  fontWeight: 800,
                                  fontSize: '0.78rem',
                                  background: usr.role === 'admin' ? '#FEE2E2' : usr.role === 'client' ? '#E0E7FF' : usr.role === 'talent' || usr.role === 'scrizian' ? '#DCFCE7' : '#FEF3C7',
                                  color: usr.role === 'admin' ? '#991B1B' : usr.role === 'client' ? '#3730A3' : usr.role === 'talent' || usr.role === 'scrizian' ? '#166534' : '#92400E',
                                  textTransform: 'uppercase'
                                }}>
                                  ● {usr.role}
                                </span>
                              </td>
                              <td>
                                <span style={{ fontSize: '0.82rem', color: '#166534', fontWeight: 700 }}>
                                  ✓ Active
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <select 
                                    defaultValue={usr.role}
                                    onChange={async (e) => {
                                      const newRole = e.target.value;
                                      try {
                                        const res = await adminApi.updateUser(usr._id || usr.id, { role: newRole });
                                        if (res.success) {
                                          setUsersList(prev => prev.map(u => (u._id === usr._id || u.id === usr.id) ? { ...u, role: newRole } : u));
                                          showToast(`✓ User role updated to ${newRole}`);
                                        } else {
                                          showToast(res.error || 'Failed to update role');
                                        }
                                      } catch (err) {
                                        console.warn('Role update error:', err);
                                      }
                                    }}
                                    className={styles.formSelect}
                                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                                  >
                                    <option value="admin">Super Admin</option>
                                    <option value="scriza_staff">Scriza Staff</option>
                                    <option value="client">Client / Company</option>
                                    <option value="scrizian">Scrizian Talent</option>
                                    <option value="contributor">Content Author</option>
                                    <option value="candidate">Job Candidate</option>
                                  </select>
                                  <button onClick={() => handleOpenEditUser(usr)} className={styles.btnActionEdit} title="Edit User">
                                    ✏️
                                  </button>
                                  <button onClick={() => handleDeleteUser(usr._id || usr.id)} className={styles.btnActionDelete} title="Delete User">
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748B' }}>
                              Loading user accounts from MongoDB Atlas...
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB: Case Studies CMS (Tasks 4 & 18 Blueprint) */}
        {activeTab === 'case-studies' && (
          showCaseStudyModal ? (
            <div className={styles.card}>
              <button 
                type="button" 
                onClick={() => setShowCaseStudyModal(false)}
                className={styles.btnBack}
              >
                ← Back to Case Studies
              </button>
              <div style={{ marginBottom: '1.5rem', paddingBottom: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>
                  {editingCaseStudy ? '✏️ Edit Case Study' : '➕ Create New Case Study'}
                </h3>
                <p className={styles.cardSub} style={{ margin: '0.2rem 0 0 0' }}>Task 4 & 18 PDF Blueprint Delivery Proof</p>
              </div>

              <form onSubmit={handleSaveCaseStudy} style={{ maxWidth: '680px' }}>
                <div className={styles.formGroup}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Case Study Title *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. UK Health-Tech App Launched in 14 Weeks"
                    value={caseStudyFormData.title} 
                    onChange={e => setCaseStudyFormData({ ...caseStudyFormData, title: e.target.value })}
                    className={styles.formInput} 
                  />
                </div>

                <div className={styles.gridTwoCols}>
                  <div className={styles.formGroup}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                      Category *
                    </label>
                    <select 
                      value={caseStudyFormData.category}
                      onChange={e => setCaseStudyFormData({ ...caseStudyFormData, category: e.target.value })}
                      className={styles.formSelect}
                    >
                      <option value="SaaS Development">SaaS Development</option>
                      <option value="Fintech/API Integration">Fintech/API Integration</option>
                      <option value="HRMS">HRMS</option>
                      <option value="School ERP">School ERP</option>
                      <option value="Hotel/Property Software">Hotel/Property Software</option>
                      <option value="Notification Platforms">Notification Platforms</option>
                      <option value="Multi-Tenant Architecture">Multi-Tenant Architecture</option>
                      <option value="Payment Integration">Payment Integration</option>
                      <option value="Website Modernization">Website Modernization</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                      Region / Country *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. United Kingdom, UAE, USA"
                      value={caseStudyFormData.region} 
                      onChange={e => setCaseStudyFormData({ ...caseStudyFormData, region: e.target.value })}
                      className={styles.formInput} 
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Business & Technical Challenge *
                  </label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Describe the problem solved..."
                    value={caseStudyFormData.challenge} 
                    onChange={e => setCaseStudyFormData({ ...caseStudyFormData, challenge: e.target.value })}
                    className={styles.formTextarea} 
                  />
                </div>

                <div className={styles.formGroup}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Architecture & Execution Approach (Solution) *
                  </label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Describe the Scrizians architecture and solution..."
                    value={caseStudyFormData.solution} 
                    onChange={e => setCaseStudyFormData({ ...caseStudyFormData, solution: e.target.value })}
                    className={styles.formTextarea} 
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem' }}>
                  <button type="submit" className={styles.btnPrimaryAction}>
                    ✓ {editingCaseStudy ? 'Save Changes' : 'Publish Case Study'}
                  </button>
                  <button type="button" className={styles.btnCancelAction} onClick={() => setShowCaseStudyModal(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.2rem' }}>
                <div>
                  <h3 className={styles.cardTitle} style={{ margin: 0 }}>Case Studies CMS & Delivery Proof</h3>
                  <p className={styles.cardSub} style={{ margin: '0.2rem 0 0 0' }}>
                    Manage platform-level client outcome case studies displayed on `/case-studies`.
                  </p>
                </div>
                <button onClick={handleOpenAddCaseStudy} className={styles.btnPrimaryAction}>
                  + Create New Case Study
                </button>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Region</th>
                      <th>Delivery Time</th>
                      <th>Publication Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {caseStudies.map(cs => (
                      <tr key={cs._id || cs.id}>
                        <td>
                          <strong>{cs.title}</strong><br/>
                          <span className={styles.subText}>{cs.slug}</span>
                        </td>
                        <td>{cs.category || 'SaaS Development'}</td>
                        <td>{cs.region || 'United States'}</td>
                        <td>{cs.deliveryTime || '12 wks'}</td>
                        <td>
                          <span style={{
                            background: cs.status === 'Published' ? '#DCFCE7' : '#FEF3C7',
                            color: cs.status === 'Published' ? '#166534' : '#92400E',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '12px',
                            fontWeight: 800,
                            fontSize: '0.8rem'
                          }}>
                            ● {cs.status || 'Published'}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionBtnGroup}>
                            <button 
                              onClick={() => handlePublishCaseStudy(cs._id || cs.id)}
                              className={styles.btnActionEdit}
                              title="Publish Case Study"
                              style={{ background: '#DCFCE7', color: '#166534' }}
                            >
                              ✓ Publish
                            </button>
                            <button onClick={() => handleOpenEditCaseStudy(cs)} className={styles.btnActionEdit} title="Edit Case Study">
                              ✏️
                            </button>
                            <button onClick={() => handleDeleteCaseStudy(cs._id || cs.id)} className={styles.btnActionDelete} title="Delete Case Study">
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* TAB 6: SEO, Pricing & Audit */}
        {activeTab === 'audit' && (
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <div>
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>SEO Metadata, Currency Pricing & Platform Audit Logs</h3>
                <p className={styles.cardSub} style={{ margin: '0.2rem 0 0 0' }}>
                  Monitor platform-wide audit trails, currency exchange baseline rates ($1 USD = ₹83.50 INR), and search engine indexing status.
                </p>
              </div>
              <span className={styles.adminBadge} style={{ background: '#0F172A' }}>AUDIT TRAIL LOGGING</span>
            </div>

            <div className={styles.gridThreeCols}>
              <div style={{ background: '#F1F5F9', padding: '1rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>🌐 Sitemap & Robots Status</div>
                <div style={{ fontSize: '0.82rem', color: '#166534', fontWeight: 700, marginTop: '0.4rem' }}>✓ /sitemap.xml (Active - 28 routes)</div>
                <div style={{ fontSize: '0.82rem', color: '#166534', fontWeight: 700, marginTop: '0.2rem' }}>✓ /robots.txt (Configured)</div>
              </div>

              <div style={{ background: '#F1F5F9', padding: '1rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>💱 Global Pricing Model</div>
                <div style={{ fontSize: '0.82rem', color: '#0F172A', marginTop: '0.4rem' }}>USD Rate: <strong>$1.00 USD</strong></div>
                <div style={{ fontSize: '0.82rem', color: '#0F172A', marginTop: '0.2rem' }}>INR Conversion: <strong>₹83.50 INR</strong></div>
              </div>

              <div style={{ background: '#F1F5F9', padding: '1rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>⚡ Performance Metric</div>
                <div style={{ fontSize: '0.82rem', color: '#16A34A', fontWeight: 800, marginTop: '0.4rem' }}>PageSpeed Score: 98+ Optimized</div>
                <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.2rem' }}>LCP: 0.8s | CLS: 0.00</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: Administrator Profile Page */}
        {activeTab === 'profile' && (
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>Administrator Profile</h3>
                <p className={styles.cardSub} style={{ margin: '0.2rem 0 0 0' }}>
                  Personal account credentials, executive title, and platform governance privileges.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  if (!isEditingProfile) {
                    setEditFormData({
                      name: currentUser?.name || displayName,
                      phone: currentUser?.phone || '+91 98765 43210',
                      title: currentUser?.title || 'Scriza Super Admin',
                      skills: currentUser?.skills || 'Platform Governance, Executive Operations, User Management',
                      avatar: currentUser?.avatar || ''
                    });
                  }
                  setIsEditingProfile(!isEditingProfile);
                }} 
                className={styles.btnPrimaryAction}
                style={{ background: isEditingProfile ? '#64748B' : '#E52B2B' }}
              >
                {isEditingProfile ? '✖ Cancel Editing' : '✏️ Edit Profile'}
              </button>
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleSaveAdminProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '640px' }}>
                <div className={styles.formGroup}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Profile Photo / Avatar Upload:
                  </label>
                  <div className={styles.imageUploadBox}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], url => setEditFormData({ ...editFormData, avatar: url }))}
                      style={{ display: 'none' }}
                      id="admin-photo-upload-input"
                    />
                    <label htmlFor="admin-photo-upload-input" style={{ cursor: 'pointer', margin: 0 }}>
                      📁 Click or Drag Image to Upload Administrator Photo
                    </label>
                    {editFormData.avatar && (
                      <div className={styles.imagePreviewRow}>
                        <img src={editFormData.avatar} alt="Preview" className={styles.imagePreview} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
                        <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 800 }}>✓ Avatar Preview Loaded</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Full Name *
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={editFormData.name}
                    onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Contact Phone *
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={editFormData.phone}
                    onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Designation / Title *
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={editFormData.title}
                    onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Operational Skills & Governance Areas
                  </label>
                  <textarea 
                    rows={3}
                    value={editFormData.skills}
                    onChange={e => setEditFormData({ ...editFormData, skills: e.target.value })}
                    className={styles.formInput}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button 
                    type="submit" 
                    className={styles.btnPrimaryAction}
                  >
                    💾 Save Profile Changes
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsEditingProfile(false)}
                    className={styles.btnCancelAction}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.5rem', borderRadius: '12px', flexWrap: 'wrap' }}>
                  <div className={styles.adminAvatarCircle} style={{ width: '64px', height: '64px', fontSize: '1.6rem' }}>
                    {currentUser?.avatar ? (
                      <img src={currentUser.avatar} alt="Admin" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      (currentUser?.name || displayName || 'A').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                      {currentUser?.name || displayName}
                    </h4>
                    <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.2rem' }}>
                      {currentUser?.title || 'Scriza Super Admin'} • <span style={{ color: '#166534', fontWeight: 700 }}>Active (2FA Enforced)</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem' }}>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.2rem', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Email Address</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', marginTop: '0.3rem' }}>{currentUser?.email || displayEmail}</div>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.2rem', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Contact Phone</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', marginTop: '0.3rem' }}>{currentUser?.phone || '+91 98765 43210'}</div>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.2rem', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Parent Entity</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', marginTop: '0.3rem' }}>Scriza Private Limited</div>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.2rem', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Access Control</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', marginTop: '0.3rem' }}>Super Administrator (Full RBAC)</div>
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.2rem', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Operational Competencies</span>
                  <div style={{ fontSize: '0.92rem', color: '#334155', marginTop: '0.3rem', lineHeight: 1.5 }}>
                    {currentUser?.skills || 'Platform Governance, Executive Operations, User Management'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
