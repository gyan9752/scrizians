'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/DashboardSidebar/DashboardSidebar';
import { NotificationBell } from '@/components/NotificationBell/NotificationBell';
import {
  jobApi,
  talentApi,
  portfolioApi,
  articleApi,
  authApi,
} from '@/lib/expressApi';
import styles from './DashboardTalent.module.css';

type TalentProfile = {
  displayName?: string;
  title?: string;
  summary?: string;
  role?: string;
  experienceYears?: number;
  skills?: string[];
  categories?: string[];
  timezone?: string;
  region?: string;
  availability?: string;
  engagementPreference?: string;
  languages?: string[];
  relationshipBadge?: string;
  hourlyRateUSD?: number;
  monthlyRateINR?: number;
  scrizianId?: string;
  verificationStatus?: string;
  status?: string;
  avatar?: string;
  avatarUrl?: string;
};

type CurrentUser = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  scrizianId?: string;
  avatar?: string;
  title?: string;
};

type Portfolio = {
  _id?: string;
  id?: string;
  title?: string;
  slug?: string;
  industry?: string;
  projectType?: string;
  summary?: string;
  role?: string;
  techStack?: string[];
  media?: any[];
  duration?: string;
  outcome?: string;
  clientName?: string;
  clientNamePermission?: boolean;
  liveUrl?: string;
  repositoryUrl?: string;
  ndaProtected?: boolean;
  status?: string;
  createdAt?: string;
  coverImageUrl?: string;
  featuredImage?: string;
};

type PortfolioForm = {
  title: string;
  industry: string;
  projectType: string;
  summary: string;
  role: string;
  techStack: string;
  duration: string;
  outcome: string;
  clientName: string;
  clientNamePermission: boolean;
  liveUrl: string;
  repositoryUrl: string;
  ndaProtected: boolean;
  coverImage?: string;
};

const initialPortfolioForm: PortfolioForm = {
  title: '',
  industry: '',
  projectType: '',
  summary: '',
  role: '',
  techStack: '',
  duration: '',
  outcome: '',
  clientName: '',
  clientNamePermission: false,
  liveUrl: '',
  repositoryUrl: '',
  ndaProtected: false,
  coverImage: '',
};

export default function TalentDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] =
    useState<string>('dashboard');

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('scrizians_token');
    localStorage.removeItem('scrizians_user');
    router.push('/dashboard');
  };

  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  const [talentProfile, setTalentProfile] =
    useState<TalentProfile | null>(null);

  const [toastMsg, setToastMsg] =
    useState<string | null>(null);

  const [jobs, setJobs] = useState<any[]>([]);

  const [portfolios, setPortfolios] =
    useState<Portfolio[]>([]);

  const [loadingProfile, setLoadingProfile] =
    useState(true);

  const [loadingJobs, setLoadingJobs] =
    useState(true);

  const [loadingPortfolios, setLoadingPortfolios] =
    useState(true);

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [savingPortfolio, setSavingPortfolio] =
    useState(false);

  const [submittingVerification, setSubmittingVerification] =
    useState(false);

  const [isEditingProfile, setIsEditingProfile] =
    useState(false);

  const [showPortfolioModal, setShowPortfolioModal] =
    useState(false);

  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    skills: '',
    experience: '',
    title: '',
    avatar: '',
  });

  const [portfolioForm, setPortfolioForm] =
    useState<PortfolioForm>(
      initialPortfolioForm
    );
  const [editingPortfolioId, setEditingPortfolioId] = useState<string | null>(null);

  const [availabilityForm, setAvailabilityForm] = useState({
    availability: 'Immediate',
    hourlyRateUSD: 35,
    monthlyRateINR: 280000,
    timezone: 'Asia/Kolkata (IST)',
    engagementPreference: 'Full-Time',
  });
  const [savingAvailability, setSavingAvailability] = useState(false);

  // Matched Opportunities State & Handlers
  const [matchedOpportunities, setMatchedOpportunities] = useState<any[]>([
    {
      id: 'opp-1',
      title: 'Lead Next.js & TypeScript Architect',
      clientCompany: 'CloudScale Inc (USA / Remote)',
      matchScore: '98% Skill Match',
      skills: ['Next.js', 'React', 'Node.js', 'TypeScript', 'AWS'],
      rate: '$35 - $45 / hr',
      duration: '6 Months (4h US EST Overlap)',
      status: 'Matched',
      postedDate: '2 hours ago'
    },
    {
      id: 'opp-2',
      title: 'Senior Full Stack Distributed Systems Engineer',
      clientCompany: 'FinTech Nexus (UK / Remote)',
      matchScore: '95% Skill Match',
      skills: ['Node.js', 'PostgreSQL', 'Docker', 'Microservices'],
      rate: '$40 - $50 / hr',
      duration: '12 Months (Full Time)',
      status: 'Matched',
      postedDate: '1 day ago'
    },
    {
      id: 'opp-3',
      title: 'Mobile & Cloud Solutions Consultant',
      clientCompany: 'HealthAI Global (Singapore / Remote)',
      matchScore: '92% Skill Match',
      skills: ['React Native', 'GraphQL', 'GCP', 'Node.js'],
      rate: '$38 - $48 / hr',
      duration: '3 Months (Contract)',
      status: 'Matched',
      postedDate: '3 days ago'
    }
  ]);

  const [selectedJobDetail, setSelectedJobDetail] = useState<any | null>(null);
  const [talentArticles, setTalentArticles] = useState<any[]>([]);

  const handleExpressInterest = (oppId: string) => {
    setMatchedOpportunities(prev =>
      prev.map(o => o.id === oppId ? { ...o, status: 'Expressed Interest' } : o)
    );
    showToast('✓ Interest registered! Your dedicated account desk will facilitate the client intro.');
  };

  const handleDeclineOpportunity = (oppId: string) => {
    setMatchedOpportunities(prev => prev.filter(o => o.id !== oppId));
    showToast('Opportunity removed from your matched list.');
  };

  useEffect(() => {
    if (talentProfile) {
      setAvailabilityForm({
        availability: talentProfile.availability || 'Immediate',
        hourlyRateUSD: talentProfile.hourlyRateUSD || 35,
        monthlyRateINR: talentProfile.monthlyRateINR || 280000,
        timezone: talentProfile.timezone || 'Asia/Kolkata (IST)',
        engagementPreference: talentProfile.engagementPreference || 'Full-Time',
      });
    }
  }, [talentProfile]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    await Promise.all([
      loadUserAndProfile(),
      loadJobs(),
      loadPortfolios(),
      loadArticles(),
    ]);
  };

  const loadArticles = async () => {
    try {
      const res = await articleApi.getMine();
      if (res && res.success && Array.isArray(res.data)) {
        setTalentArticles(res.data);
      }
    } catch (err) {
      console.warn('Load talent articles warning:', err);
    }
  };

  const loadUserAndProfile = async () => {
    try {
      setLoadingProfile(true);

      const stored = localStorage.getItem(
        'scrizians_user'
      );

      let storedUser: CurrentUser = {};

      if (stored) {
        try {
          storedUser = JSON.parse(stored);
          setCurrentUser(storedUser);
        } catch {
          localStorage.removeItem(
            'scrizians_user'
          );
        }
      }

      try {
        const response =
          await talentApi.getMyProfile();

const profile = response?.data ?? null;          

        if (profile) {
          setTalentProfile(profile);

          const mergedUser = {
            ...storedUser,
            name:
              profile.displayName ||
              storedUser.name ||
              '',
            email:
              storedUser.email || '',
            role: 'scrizian',
            scrizianId:
              profile.scrizianId ||
              storedUser.scrizianId ||
              '',
          };

          setCurrentUser(mergedUser);

          localStorage.setItem(
            'scrizians_user',
            JSON.stringify(mergedUser)
          );

          setEditFormData({
            name:
              profile.displayName ||
              storedUser.name ||
              '',
            phone: storedUser.phone || '',
            skills:
              Array.isArray(profile.skills)
                ? profile.skills.join(', ')
                : profile.skills || '',
            experience:
              profile.experienceYears !==
              undefined
                ? `${profile.experienceYears} Years`
                : '',
            title:
              profile.title || '',
            avatar:
              storedUser.avatar ||
              profile.avatar ||
              '',
          });
        }
      } catch (error: any) {
        if (
          error?.status === 404 ||
          error?.response?.status === 404 ||
          error?.message?.includes(
            'Talent profile has not been created yet'
          )
        ) {
          setTalentProfile(null);

          setEditFormData({
            name: storedUser.name || '',
            phone: storedUser.phone || '',
            skills: '',
            experience: '',
            title: '',
            avatar: storedUser.avatar || '',
          });

          return;
        }

        throw error;
      }
    } catch (error: any) {
      console.warn(
        'Talent profile load error:',
        error
      );

      showToast(
        error?.message ||
          'Unable to load talent profile.'
      );
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadJobs = async () => {
    try {
      setLoadingJobs(true);

      const response =
        await jobApi.getAll(
          'page=1&limit=20'
        );

      const data =
        response?.data || response;

      if (Array.isArray(data)) {
        setJobs(data);
      } else if (
        Array.isArray(data?.items)
      ) {
        setJobs(data.items);
      } else if (
        Array.isArray(data?.jobs)
      ) {
        setJobs(data.jobs);
      } else {
        setJobs([]);
      }
    } catch (error: any) {
      console.warn(
        'Jobs load error:',
        error
      );

      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadPortfolios = async () => {
    try {
      setLoadingPortfolios(true);

      const response =
        await portfolioApi.getAll();

      const data =
        response?.data || response;

      if (Array.isArray(data)) {
        setPortfolios(data);
      } else if (
        Array.isArray(data?.items)
      ) {
        setPortfolios(data.items);
      } else if (
        Array.isArray(data?.portfolios)
      ) {
        setPortfolios(data.portfolios);
      } else {
        setPortfolios([]);
      }
    } catch (error: any) {
      console.warn(
        'Portfolio load error:',
        error
      );

      setPortfolios([]);

      if (
        error?.status !== 404 &&
        error?.response?.status !== 404
      ) {
        showToast(
          error?.message ||
            'Unable to load portfolio projects.'
        );
      }
    } finally {
      setLoadingPortfolios(false);
    }
  };

  const displayName =
    talentProfile?.displayName ||
    currentUser?.name ||
    'Talent';

  const displayEmail =
    currentUser?.email ||
    'talent@scrizians.com';

  const displayId =
    talentProfile?.scrizianId ||
    currentUser?.scrizianId ||
    '—';

  const displayPhone =
    editFormData.phone || 'Private';

  const displaySkills =
    Array.isArray(talentProfile?.skills)
      ? talentProfile.skills.join(', ')
      : talentProfile?.skills ||
        editFormData.skills ||
        'Not added';

  const displayExperience =
    talentProfile?.experienceYears !==
    undefined
      ? `${talentProfile.experienceYears} Years`
      : editFormData.experience ||
        'Not added';

  const displayTitle =
    talentProfile?.title ||
    editFormData.title ||
    'Scrizian Talent';

  const displayHourlyRate =
    talentProfile?.hourlyRateUSD
      ? `$${talentProfile.hourlyRateUSD} / hr`
      : 'Not configured';

  const displayMonthlyRate =
    talentProfile?.monthlyRateINR
      ? `₹${talentProfile.monthlyRateINR.toLocaleString(
          'en-IN'
        )} / month`
      : 'Not configured';

  const showToast = (msg: string) => {
    setToastMsg(msg);

    setTimeout(
      () => setToastMsg(null),
      3500
    );
  };

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

  const handleProjectBannerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Project banner image should be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPortfolioForm(prev => ({ ...prev, coverImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openEditProfile = () => {
    setEditFormData({
      name: displayName,
      phone: currentUser?.phone || editFormData.phone,
      skills: displaySkills,
      experience: displayExperience,
      title: displayTitle,
      avatar: currentUser?.avatar || talentProfile?.avatar || '',
    });

    setActiveTab('profile');
    setIsEditingProfile(true);
  };

  const openPortfolioModal = () => {
  if (!talentProfile) {
    showToast(
      'Please create your talent profile first.'
    );
    setActiveTab('profile');
    setIsEditingProfile(true);
    return;
  }

  setPortfolioForm(initialPortfolioForm);
  setActiveTab('portfolio');
  setShowPortfolioModal(true);
};

  const handlePortfolioChange = (
    field: keyof PortfolioForm,
    value: string | boolean
  ) => {
    setPortfolioForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOpenEditPortfolio = (p: Portfolio) => {
    setEditingPortfolioId(p._id || p.id || null);
    setPortfolioForm({
      title: p.title || '',
      industry: p.industry || '',
      projectType: p.projectType || '',
      summary: p.summary || '',
      role: p.role || '',
      techStack: Array.isArray(p.techStack) ? p.techStack.join(', ') : '',
      duration: p.duration || '',
      outcome: p.outcome || '',
      clientName: p.clientName || '',
      clientNamePermission: !!p.clientNamePermission,
      liveUrl: p.liveUrl || '',
      repositoryUrl: p.repositoryUrl || '',
      ndaProtected: !!p.ndaProtected,
      coverImage: p.coverImageUrl || p.featuredImage || '',
    });
    setShowPortfolioModal(true);
  };

  const handleCreatePortfolio = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      setSavingPortfolio(true);

      const techStack =
        portfolioForm.techStack
          .split(',')
          .map((item) =>
            item.trim()
          )
          .filter(Boolean);

      const payload = {
        title:
          portfolioForm.title.trim(),
        industry:
          portfolioForm.industry.trim(),
        projectType:
          portfolioForm.projectType.trim(),
        summary:
          portfolioForm.summary.trim(),
        role:
          portfolioForm.role.trim(),
        techStack,
        duration:
          portfolioForm.duration.trim(),
        outcome:
          portfolioForm.outcome.trim(),
        clientName:
          portfolioForm.clientName.trim(),
        clientNamePermission:
          portfolioForm.clientNamePermission,
        liveUrl:
          portfolioForm.liveUrl.trim(),
        repositoryUrl:
          portfolioForm.repositoryUrl.trim(),
        ndaProtected:
          portfolioForm.ndaProtected,
        media: portfolioForm.coverImage ? [{ url: portfolioForm.coverImage, type: 'image' }] : [],
        featuredImage: portfolioForm.coverImage || undefined,
      };

      let response: any;
      if (editingPortfolioId) {
        response = await portfolioApi.update(editingPortfolioId, payload);
      } else {
        response = await portfolioApi.create(payload);
      }

      if (!response?.success) {
        throw new Error(
          response?.message ||
            response?.error ||
            'Unable to save portfolio project.'
        );
      }

      setShowPortfolioModal(false);
      setEditingPortfolioId(null);
      setPortfolioForm(
        initialPortfolioForm
      );

      showToast(
        editingPortfolioId
          ? '✓ Portfolio project updated successfully.'
          : '✓ Portfolio project created successfully as Draft.'
      );

      await loadPortfolios();
    } catch (error: any) {
      console.warn(
        'Save portfolio error:',
        error
      );

      showToast(
        error?.message ||
          'Unable to save portfolio project. Please try again.'
      );
    } finally {
      setSavingPortfolio(false);
    }
  };

  const handleSaveAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingAvailability(true);
      const payload = {
        availability: availabilityForm.availability,
        hourlyRateUSD: Number(availabilityForm.hourlyRateUSD),
        monthlyRateINR: Number(availabilityForm.monthlyRateINR),
        timezone: availabilityForm.timezone,
        engagementPreference: availabilityForm.engagementPreference,
      };
      const response = await talentApi.updateProfile(payload);
      if (response?.success && response?.data) {
        setTalentProfile(response.data);
        showToast('✓ Availability & Rate Card settings saved successfully to MongoDB!');
      } else {
        showToast(response?.message || response?.error || 'Unable to update availability.');
      }
    } catch (err: any) {
      showToast('Error updating availability: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingAvailability(false);
    }
  };
  const handleSubmitPortfolio = async (
  id: string
) => {
  try {
    const response =
      await portfolioApi.submit(id);

    if (!response?.success) {
      throw new Error(
        response?.message ||
          response?.error ||
          'Unable to submit portfolio.'
      );
    }

    showToast(
      '✓ Portfolio submitted for review.'
    );

    await loadPortfolios();
  } catch (error: any) {
    console.warn(
      'Submit portfolio error:',
      error
    );

    showToast(
      error?.message ||
        'Unable to submit portfolio. Please try again.'
    );
  }
};

const handleDeletePortfolio = async (
  id: string
) => {
  const confirmed =
    window.confirm(
      'Are you sure you want to delete this portfolio project?'
    );

  if (!confirmed) return;

  try {
    const response =
      await portfolioApi.delete(id);

    if (!response?.success) {
      throw new Error(
        response?.message ||
          response?.error ||
          'Unable to delete portfolio.'
      );
    }

    showToast(
      '✓ Portfolio project deleted successfully.'
    );

    await loadPortfolios();
  } catch (error: any) {
    console.warn(
      'Delete portfolio error:',
      error
    );

    showToast(
      error?.message ||
        'Unable to delete portfolio. Please try again.'
    );
  }
};

  const handleSaveProfile = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      setSavingProfile(true);

      const experienceMatch =
        editFormData.experience.match(
          /\d+/
        );

     const experienceYears =
  experienceMatch
    ? Number(experienceMatch[0])
    : undefined;

const skills =
  editFormData.skills
    .split(',')
    .map((skill) =>
      skill.trim()
    )
    .filter(Boolean);

const payload: any = {
  displayName:
    editFormData.name.trim(),
  title:
    editFormData.title.trim(),
  skills,
};

if (editFormData.avatar) {
  payload.avatar = editFormData.avatar;
}

payload.experienceYears =
  experienceYears ?? 0;

      if (talentProfile) {
        payload.summary =
          talentProfile.summary ||
          'Software developer with experience in building web applications.';

        payload.role =
          talentProfile.role ||
          editFormData.title.trim();
      } else {
        payload.summary =
          'Software developer with experience in building web applications.';

        payload.role =
          editFormData.title.trim();
      }

      await authApi.updateProfile({
        name: editFormData.name.trim(),
        phone: editFormData.phone.trim(),
        title: editFormData.title.trim(),
        avatar: editFormData.avatar,
      });

      const response = talentProfile
        ? await talentApi.updateProfile(
            payload
          )
        : await talentApi.createProfile(
            payload
          );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            response?.error ||
            'Unable to save talent profile.'
        );
      }

      const updatedProfile =
        response?.data || response;

      if (updatedProfile) {
        setTalentProfile(
          updatedProfile
        );

        const updatedUser = {
          ...currentUser,
          name:
            updatedProfile.displayName ||
            editFormData.name,
          phone:
            editFormData.phone ||
            currentUser?.phone,
          title:
            editFormData.title ||
            currentUser?.title,
          role: 'scrizian',
          scrizianId:
            updatedProfile.scrizianId ||
            currentUser?.scrizianId,
          avatar:
            editFormData.avatar ||
            currentUser?.avatar,
        };

        setCurrentUser(
          updatedUser
        );

        localStorage.setItem(
          'scrizians_user',
          JSON.stringify(
            updatedUser
          )
        );
      }

      setIsEditingProfile(false);

      showToast(
        talentProfile
          ? '✓ Talent profile updated successfully.'
          : '✓ Talent profile created successfully.'
      );
    } catch (error: any) {
      console.warn(
        'Save profile error:',
        error
      );

      showToast(
        error?.message ||
          'Unable to save profile. Please try again.'
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSubmitVerification =
    async () => {
      try {
        setSubmittingVerification(true);

        const response =
          await talentApi.submitVerification();

        if (!response?.success) {
          throw new Error(
            response?.message ||
              response?.error ||
              'Unable to submit profile for verification.'
          );
        }

        const refreshed =
          await talentApi.getMyProfile();

        const updatedProfile =
  refreshed?.data ?? null;

        if (updatedProfile) {
          setTalentProfile(
            updatedProfile
          );
        }

        showToast(
          '✓ Profile submitted for verification.'
        );
      } catch (error: any) {
        console.warn(
          'Submit verification error:',
          error
        );

        showToast(
          error?.message ||
            'Unable to submit profile for verification.'
        );
      } finally {
        setSubmittingVerification(
          false
        );
      }
    };

  const verificationStatus =
    talentProfile?.verificationStatus ||
    'pending';

  const isPendingDraft =
    verificationStatus === 'pending' &&
    talentProfile?.status === 'draft';

  const getPortfolioId = (
    portfolio: Portfolio
  ) =>
    portfolio._id ||
    portfolio.id ||
    portfolio.slug ||
    Math.random().toString();

  const getPortfolioStatusStyle = (
    status?: string
  ) => {
    switch (status) {
      case 'Approved':
        return {
          background: '#DCFCE7',
          color: '#166534',
        };

      case 'Submitted':
        return {
          background: '#DBEAFE',
          color: '#1D4ED8',
        };

      case 'Changes Requested':
        return {
          background: '#FEF3C7',
          color: '#92400E',
        };

      case 'Rejected':
        return {
          background: '#FEE2E2',
          color: '#991B1B',
        };

      default:
        return {
          background: '#F1F5F9',
          color: '#475569',
        };
    }
  };

  return (
    <div
      className={
        styles.dashboardLayout
      }
    >
      <DashboardSidebar
        role="talent"
        activeTab={activeTab}
        onTabChange={(tab: any) =>
          setActiveTab(tab)
        }
        user={
          currentUser || {
            name: displayName,
            role: 'scrizian',
            email: displayEmail,
            scrizianId: displayId,
          }
        }
        isCollapsed={isSidebarCollapsed}
      />

      <div
        className={`${styles.container} ${isSidebarCollapsed ? styles.containerCollapsed : ''}`}
      >
        {toastMsg && (
          <div
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              background: '#0B172A',
              color: '#ffffff',
              padding:
                '0.9rem 1.4rem',
              borderRadius: '10px',
              zIndex: 99999,
              fontWeight: 700,
              fontSize: '0.92rem',
              border:
                '1px solid rgba(229, 43, 43, 0.5)',
              boxShadow:
                '0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 0 20px rgba(229, 43, 43, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
            }}
          >
            <span>⚡</span>

            <span>
              {toastMsg}
            </span>

            <button
              onClick={() =>
                setToastMsg(null)
              }
              style={{
                background:
                  'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '1.2rem',
                cursor: 'pointer',
                marginLeft: '0.5rem',
              }}
            >
              ×
            </button>
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
              <span>Specialist Portal</span>
            </div>
          </div>

          <div className={styles.topNavbarRight}>
            <span
              className={styles.badge}
              style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
            >
              {verificationStatus === 'approved'
                ? '✓ VERIFIED TALENT'
                : '⏳ VERIFICATION PENDING'}
            </span>

            <div className={styles.bellWrapper}>
              <NotificationBell />
            </div>

            {/* Dynamic Talent Profile Pill */}
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
                  (displayName || 'T').charAt(0).toUpperCase()
                )}
              </div>
              <div className={styles.userProfileText}>
                <span className={styles.userProfileName}>{displayName}</span>
                <span className={styles.userProfileRole}>{displayId !== '—' ? `ID: ${displayId}` : 'Scrizian Specialist'}</span>
              </div>
              <span className={styles.userChevron}>▼</span>

              {showProfileDropdown && (
                <div className={styles.profileDropdown} onClick={(e) => e.stopPropagation()}>
                  <button 
                    className={styles.profileDropdownItem}
                    onClick={() => {
                      setShowProfileDropdown(false);
                      openEditProfile();
                    }}
                  >
                    <span>👤</span> Scrizian Profile
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

        {/* TAB 0: Talent Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Row 1: Top Hero & Category Previews */}
            <div className={styles.overviewGrid}>
              {/* 1. Welcome Card */}
              <div className={styles.overviewWelcomeCard}>
                <div>
                  <h3 className={styles.welcomeTitle}>
                    Welcome {talentProfile?.displayName || currentUser?.name || 'Verified Specialist'}!
                  </h3>
                  <p className={styles.welcomeSub}>
                    Role: Verified Specialist | Scrizian ID: {currentUser?.scrizianId || 'SCR-8841'}
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

              {/* 2. Portfolio & Showcase */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Portfolio Showcase <span className={styles.cardHeaderCount}>{portfolios.length}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('portfolio')}
                    className={styles.cardViewAllLink}
                  >
                    View All
                  </button>
                </div>
                <div className={styles.miniCardsRow}>
                  <div className={styles.miniCard}>
                    <span className={styles.miniCardIcon}>🎨</span>
                    <span className={styles.miniCardLabel}>Case Studies</span>
                  </div>
                  <div className={styles.miniCard}>
                    <span className={styles.miniCardIcon}>🔒</span>
                    <span className={styles.miniCardLabel}>NDA Works</span>
                  </div>
                  <div className={styles.miniCard}>
                    <span className={styles.miniCardIcon}>🌐</span>
                    <span className={styles.miniCardLabel}>Live Apps</span>
                  </div>
                </div>
              </div>

              {/* 3. Opportunities Preview */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Active Opportunities <span className={styles.cardHeaderCount}>{jobs.length}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('jobs')}
                    className={styles.cardViewAllLink}
                  >
                    View All
                  </button>
                </div>
                <div className={styles.miniCardsRow}>
                  {jobs.slice(0, 3).map((j, idx) => (
                    <div key={j.id || idx} className={styles.miniCard}>
                      <span className={styles.miniCardIcon}>💼</span>
                      <span className={styles.miniCardLabel} title={j.title}>
                        {j.title ? j.title.split(' ')[0] : `Role ${idx + 1}`}
                      </span>
                    </div>
                  ))}
                  {jobs.length === 0 && [1, 2, 3].map((_, idx) => (
                    <div key={`empty-job-${idx}`} className={styles.miniCard}>
                      <span className={styles.miniCardIcon}>💼</span>
                      <span className={styles.miniCardLabel}>Opening</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Charts & Workflows */}
            <div className={styles.overviewGrid}>
              {/* 4. Availability & Capacity Donut Chart */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Weekly Capacity & Hours
                  </div>
                </div>
                <div className={styles.chartContainer}>
                  <svg width="130" height="130" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="45" fill="none" stroke="#F1F5F9" strokeWidth="18" />
                    {/* Available (Green) */}
                    <circle
                      cx="60"
                      cy="60"
                      r="45"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="18"
                      strokeDasharray="226 283"
                      strokeDashoffset="0"
                      transform="rotate(-90 60 60)"
                    />
                    {/* In Discussion (Amber) */}
                    <circle
                      cx="60"
                      cy="60"
                      r="45"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="18"
                      strokeDasharray="56 283"
                      strokeDashoffset="-226"
                      transform="rotate(-90 60 60)"
                    />
                    <text x="60" y="65" textAnchor="middle" fontSize="16" fontWeight="800" fill="#0F172A">
                      40h
                    </text>
                  </svg>
                  <div className={styles.chartLegend}>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#10B981' }} />
                      <span>Available <strong>32h/wk</strong></span>
                    </div>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#F59E0B' }} />
                      <span>Reserved <strong>8h/wk</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Tech Stack Distribution Pie Chart */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Core Skill Distribution
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
                      <span>Frontend <strong>48%</strong></span>
                    </div>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#E52B2B' }} />
                      <span>Backend <strong>32%</strong></span>
                    </div>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#94A3B8' }} />
                      <span>Cloud <strong>20%</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Hourly Rate & Contract */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Rate Card & Engagement
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('availability')}
                    className={styles.cardViewAllLink}
                  >
                    View All
                  </button>
                </div>
                <div className={styles.listItemsWrapper}>
                  <div className={styles.listRowItem}>
                    <div>
                      <div className={styles.listTitle}>Standard Billing Rate</div>
                      <div className={styles.listSub}>USD Currency / Contract Hour</div>
                    </div>
                    <div className={styles.listRightBadge} style={{ color: '#E52B2B', fontSize: '1rem', fontWeight: 900 }}>
                      ${talentProfile?.hourlyRateUSD || 45}/hr
                    </div>
                  </div>
                  <div className={styles.listRowItem}>
                    <div>
                      <div className={styles.listTitle}>Payout Frequency</div>
                      <div className={styles.listSub}>Bi-weekly Wire / Direct Deposit</div>
                    </div>
                    <div className={styles.listRightBadge} style={{ color: '#166534', fontWeight: 700 }}>
                      ✓ Verified
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Projects, Jobs & Status */}
            <div className={styles.overviewGrid}>
              {/* 7. Recent Projects */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Recent Portfolio Works
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('portfolio')}
                    className={styles.cardViewAllLink}
                  >
                    View All
                  </button>
                </div>
                {portfolios.length > 0 ? (
                  <div className={styles.listItemsWrapper}>
                    {portfolios.slice(0, 3).map((p, idx) => (
                      <div key={p.id || idx} className={styles.listRowItem}>
                        <div>
                          <div className={styles.listTitle}>{p.title}</div>
                          <div className={styles.listSub}>{(p.techStack && p.techStack.join(', ')) || p.role || 'Case Study'}</div>
                        </div>
                        <div className={styles.listRightBadge} style={{ color: '#0F172A', fontSize: '0.76rem' }}>
                          Showcase
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyStateNotice}>
                    <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>🎨</div>
                    <div className={styles.emptyStateTitle}>No Projects Added</div>
                    <div className={styles.emptyStateText}>Showcase projects will appear here once published.</div>
                  </div>
                )}
              </div>

              {/* 8. Matching Jobs */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Recommended Jobs
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('jobs')}
                    className={styles.cardViewAllLink}
                  >
                    View All
                  </button>
                </div>
                {jobs.length > 0 ? (
                  <div className={styles.listItemsWrapper}>
                    {jobs.slice(0, 3).map((j, idx) => (
                      <div key={j.id || idx} className={styles.listRowItem}>
                        <div>
                          <div className={styles.listTitle}>{j.title}</div>
                          <div className={styles.listSub}>{j.company}</div>
                        </div>
                        <div className={styles.listRightBadge} style={{ color: '#E52B2B', fontSize: '0.76rem', fontWeight: 700 }}>
                          {j.rate || 'Active'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyStateNotice}>
                    <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>💼</div>
                    <div className={styles.emptyStateTitle}>No Job Matches Found</div>
                    <div className={styles.emptyStateText}>New job openings will be posted here.</div>
                  </div>
                )}
              </div>

              {/* 9. Scrizian Verification Badge */}
              <div className={styles.overviewCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderTitle}>
                    Verification Status
                  </div>
                </div>
                <div className={styles.listItemsWrapper}>
                  <div style={{ background: '#DCFCE7', border: '1px solid #BBF7D0', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>✓</div>
                    <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.95rem' }}>Scrizian Certified Specialist</div>
                    <div style={{ fontSize: '0.78rem', color: '#15803D', marginTop: '0.2rem' }}>
                      Profile active & available for client placement
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PROFILE */}
        {activeTab === 'profile' && (
          <div className={styles.grid}>
            <div
              className={styles.card}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                  marginBottom:
                    '1rem',
                  paddingBottom:
                    '0.75rem',
                  borderBottom:
                    '1px solid #E2E8F0',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <h3
                    className={
                      styles.cardTitle
                    }
                    style={{ margin: 0 }}
                  >
                    Talent Bio & Tech Stack
                  </h3>
                  <p
                    className={
                      styles.cardSub
                    }
                    style={{ margin: '0.2rem 0 0 0' }}
                  >
                    Your verified engineering profile showcase for Scriza enterprise clients.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!isEditingProfile) {
                      openEditProfile();
                    } else {
                      setIsEditingProfile(false);
                    }
                  }}
                  className={
                    styles.btnSecondary
                  }
                  style={{
                    padding:
                      '0.5rem 1.1rem',
                    fontSize:
                      '0.85rem',
                    background:
                      isEditingProfile ? '#64748B' : '#E52B2B',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                  }}
                >
                  {isEditingProfile ? '✖ Cancel Editing' : '✏️ Edit Profile'}
                </button>
              </div>

              {isEditingProfile ? (
                <form
                  onSubmit={
                    handleSaveProfile
                  }
                  style={{
                    display:
                      'flex',
                    flexDirection:
                      'column',
                    gap: '1rem',
                    maxWidth:
                      '640px',
                  }}
                >
                  <div
                    style={{
                      background:
                        '#FEF2F2',
                      border:
                        '1px solid #FECACA',
                      padding:
                        '0.8rem 1rem',
                      borderRadius:
                        '8px',
                      color: '#991B1B',
                      fontSize:
                        '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    Update your public talent profile details. Changes are saved through the Scrizians backend.
                  </div>

                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.4rem' }}>
                      Profile Photo / Avatar
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '0.5rem' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', background: '#F1F5F9', border: '2px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {editFormData.avatar ? (
                          <img src={editFormData.avatar} alt="Avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '1.6rem', color: '#94A3B8' }}>👤</span>
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
                    <label
                      style={{
                        fontSize:
                          '0.82rem',
                        fontWeight: 700,
                        color:
                          '#0F172A',
                        display:
                          'block',
                        marginBottom:
                          '0.3rem',
                      }}
                    >
                      Full Name *
                    </label>

                    <input
                      type="text"
                      required
                      value={
                        editFormData.name
                      }
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          name: e.target
                            .value,
                        })
                      }
                      style={{
                        width: '100%',
                        padding:
                          '0.65rem 0.8rem',
                        border:
                          '1px solid #CBD5E1',
                        borderRadius:
                          '8px',
                        fontSize:
                          '0.92rem',
                        fontWeight: 600,
                        outline:
                          'none',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize:
                          '0.82rem',
                        fontWeight: 700,
                        color:
                          '#0F172A',
                        display:
                          'block',
                        marginBottom:
                          '0.3rem',
                      }}
                    >
                      Phone Number
                    </label>

                    <input
                      type="text"
                      value={
                        editFormData.phone
                      }
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          phone: e.target
                            .value,
                        })
                      }
                      placeholder="Managed privately"
                      style={{
                        width: '100%',
                        padding:
                          '0.65rem 0.8rem',
                        border:
                          '1px solid #CBD5E1',
                        borderRadius:
                          '8px',
                        fontSize:
                          '0.92rem',
                        fontWeight: 600,
                        outline:
                          'none',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize:
                          '0.82rem',
                        fontWeight: 700,
                        color:
                          '#0F172A',
                        display:
                          'block',
                        marginBottom:
                          '0.3rem',
                      }}
                    >
                      Primary Skill Tags *
                    </label>

                    <input
                      type="text"
                      required
                      placeholder="e.g. Next.js, Python, Cloud Architecture"
                      value={
                        editFormData.skills
                      }
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          skills:
                            e.target.value,
                        })
                      }
                      style={{
                        width: '100%',
                        padding:
                          '0.65rem 0.8rem',
                        border:
                          '1px solid #CBD5E1',
                        borderRadius:
                          '8px',
                        fontSize:
                          '0.92rem',
                        fontWeight: 600,
                        outline:
                          'none',
                      }}
                    />
                  </div>

                  <div
                    className={
                      styles.gridTwoCols
                    }
                  >
                    <div>
                      <label
                        style={{
                          fontSize:
                            '0.82rem',
                          fontWeight: 700,
                          color:
                            '#0F172A',
                          display:
                            'block',
                          marginBottom:
                            '0.3rem',
                        }}
                      >
                        Total Experience *
                      </label>

                      <input
                        type="text"
                        required
                        placeholder="e.g. 8 Years"
                        value={
                          editFormData.experience
                        }
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            experience:
                              e.target
                                .value,
                          })
                        }
                        style={{
                          width: '100%',
                          padding:
                            '0.65rem 0.8rem',
                          border:
                            '1px solid #CBD5E1',
                          borderRadius:
                            '8px',
                          fontSize:
                            '0.92rem',
                          fontWeight: 600,
                          outline:
                            'none',
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          fontSize:
                            '0.82rem',
                          fontWeight: 700,
                          color:
                            '#0F172A',
                          display:
                            'block',
                          marginBottom:
                            '0.3rem',
                        }}
                      >
                        Title / Role *
                      </label>

                      <input
                        type="text"
                        required
                        placeholder="e.g. Senior Full-Stack Engineer"
                        value={
                          editFormData.title
                        }
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            title:
                              e.target.value,
                          })
                        }
                        style={{
                          width: '100%',
                          padding:
                            '0.65rem 0.8rem',
                          border:
                            '1px solid #CBD5E1',
                          borderRadius:
                            '8px',
                          fontSize:
                            '0.92rem',
                          fontWeight: 600,
                          outline:
                            'none',
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display:
                        'flex',
                      gap: '0.8rem',
                      marginTop:
                        '0.5rem',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setIsEditingProfile(
                          false
                        )
                      }
                      style={{
                        flex: 1,
                        padding:
                          '0.75rem',
                        background:
                          '#F1F5F9',
                        border:
                          'none',
                        borderRadius:
                          '8px',
                        fontWeight: 700,
                        color:
                          '#475569',
                        cursor:
                          'pointer',
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={
                        savingProfile
                      }
                      style={{
                        flex: 1,
                        padding:
                          '0.75rem',
                        background:
                          '#E52B2B',
                        border:
                          'none',
                        borderRadius:
                          '8px',
                        fontWeight: 800,
                        color:
                          '#ffffff',
                        cursor:
                          savingProfile
                            ? 'not-allowed'
                            : 'pointer',
                        opacity:
                          savingProfile
                            ? 0.7
                            : 1,
                        boxShadow:
                          '0 4px 14px rgba(229, 43, 43, 0.35)',
                      }}
                    >
                      {savingProfile
                        ? 'Saving...'
                        : '💾 Save Profile Changes'}
                    </button>
                  </div>
                </form>
              ) : loadingProfile ? (
                <div
                  style={{
                    padding:
                      '1.5rem',
                    color:
                      '#64748B',
                  }}
                >
                  Loading your verified
                  talent profile...
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', background: '#F8FAFC', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '1.25rem' }}>
                    <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'linear-gradient(135deg, #E52B2B 0%, #0B172A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '1.7rem', fontWeight: 900, overflow: 'hidden', boxShadow: '0 4px 12px rgba(229, 43, 43, 0.2)' }}>
                      {currentUser?.avatar || talentProfile?.avatar ? (
                        <img src={currentUser?.avatar || talentProfile?.avatar} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>{displayName}</h3>
                      <p style={{ margin: '0.2rem 0 0 0', color: '#64748B', fontSize: '0.9rem', fontWeight: 600 }}>
                        {displayTitle} • ID: <strong style={{ color: '#E52B2B', fontFamily: 'monospace' }}>{displayId}</strong>
                      </p>
                    </div>
                  </div>

                  <div
                    className={
                      styles.gridTwoCols
                    }
                  >
                  <div
                    style={{
                      background:
                        '#F8FAFC',
                      border:
                        '1px solid #E2E8F0',
                      padding: '1rem',
                      borderRadius:
                        '8px',
                    }}
                  >
                    <p
                      style={{
                        margin:
                          '0.4rem 0',
                        color:
                          '#0F172A',
                        fontWeight: 600,
                      }}
                    >
                      <strong>
                        Full Name:
                      </strong>{' '}
                      {displayName}
                    </p>

                    <p
                      style={{
                        margin:
                          '0.4rem 0',
                        color:
                          '#0F172A',
                        fontWeight: 600,
                      }}
                    >
                      <strong>
                        Email:
                      </strong>{' '}
                      {displayEmail}
                    </p>

                    <p
                      style={{
                        margin:
                          '0.4rem 0',
                        color:
                          '#0F172A',
                        fontWeight: 600,
                      }}
                    >
                      <strong>
                        Phone:
                      </strong>{' '}
                      {displayPhone}
                    </p>

                    <p
                      style={{
                        margin:
                          '0.4rem 0',
                        color:
                          '#0F172A',
                        fontWeight: 600,
                      }}
                    >
                      <strong>
                        Specialization:
                      </strong>{' '}
                      {displayTitle}
                    </p>
                  </div>

                  <div
                    style={{
                      background:
                        '#F8FAFC',
                      border:
                        '1px solid #E2E8F0',
                      padding: '1rem',
                      borderRadius:
                        '8px',
                    }}
                  >
                    <p
                      style={{
                        margin:
                          '0.4rem 0',
                        color:
                          '#0F172A',
                        fontWeight: 600,
                      }}
                    >
                      <strong>
                        Experience:
                      </strong>{' '}
                      {displayExperience}
                    </p>

                    <p
                      style={{
                        margin:
                          '0.4rem 0',
                        color:
                          '#0F172A',
                        fontWeight: 600,
                      }}
                    >
                      <strong>
                        Skills:
                      </strong>{' '}
                      {displaySkills}
                    </p>

                    <p
                      style={{
                        margin:
                          '0.4rem 0',
                        color:
                          '#0F172A',
                        fontWeight: 600,
                      }}
                    >
                      <strong>
                        Hourly Rate:
                      </strong>{' '}
                      {displayHourlyRate}
                    </p>

                    <p
                      style={{
                        margin:
                          '0.4rem 0',
                        color:
                          '#0F172A',
                        fontWeight: 600,
                      }}
                    >
                      <strong>
                        Verification:
                      </strong>{' '}
                      {talentProfile?.verificationStatus ||
                        'Pending'}
                    </p>

                    {isPendingDraft && (
                      <button
                        type="button"
                        onClick={
                          handleSubmitVerification
                        }
                        disabled={
                          submittingVerification
                        }
                        style={{
                          marginTop:
                            '0.6rem',
                          background:
                            '#E52B2B',
                          color:
                            '#ffffff',
                          border: 'none',
                          padding:
                            '0.55rem 1rem',
                          borderRadius:
                            '8px',
                          fontWeight: 800,
                          cursor:
                            submittingVerification
                              ? 'not-allowed'
                              : 'pointer',
                          fontSize:
                            '0.82rem',
                          opacity:
                            submittingVerification
                              ? 0.7
                              : 1,
                        }}
                      >
                        {submittingVerification
                          ? 'Submitting...'
                          : 'Submit for Verification'}
                      </button>
                    )}
                  </div>
                </div>
                </>
              )}
            </div>

            <div
              className={styles.card}
            >
              <h3
                className={
                  styles.cardTitle
                }
              >
                Availability & Status
              </h3>

              <p
                className={
                  styles.cardSub
                }
              >
                Client matching settings.
              </p>

              <div
                style={{
                  background:
                    '#F0FDF4',
                  border:
                    '1px solid #86EFAC',
                  padding: '1rem',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    color:
                      '#166534',
                  }}
                >
                  🟢{' '}
                  {talentProfile?.availability ||
                    'Availability not configured'}
                </div>

                <div
                  style={{
                    fontSize:
                      '0.85rem',
                    color:
                      '#15803D',
                    marginTop:
                      '0.4rem',
                  }}
                >
                  {talentProfile?.timezone
                    ? `Timezone: ${talentProfile.timezone}`
                    : 'Configure your availability and timezone from your profile.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PORTFOLIO */}
        {activeTab === 'portfolio' && (
          showPortfolioModal ? (
            <div className={styles.card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowPortfolioModal(false)}
                  className={styles.btnBack}
                >
                  ← Back to My Projects
                </button>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B' }}>
                  Portfolio Showcase Project
                </span>
              </div>

              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.3rem' }}>
                ➕ Submit New Showcase Project
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#64748B', marginBottom: '1.2rem' }}>
                Create your portfolio project. It will be saved as a Draft and can be submitted for review later.
              </p>

              <form onSubmit={handleCreatePortfolio} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '800px' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.4rem' }}>
                    Project Cover Banner / Screenshot (Optional)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label style={{ background: '#0F172A', color: '#fff', padding: '0.55rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, display: 'inline-block' }}>
                      Upload Banner
                      <input type="file" accept="image/*" onChange={handleProjectBannerFile} style={{ display: 'none' }} />
                    </label>
                    {portfolioForm.coverImage && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <img src={portfolioForm.coverImage} alt="Cover Preview" style={{ width: '56px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
                        <button type="button" onClick={() => setPortfolioForm(prev => ({ ...prev, coverImage: '' }))} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.gridTwoCols}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.3rem' }}>
                      Project Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={portfolioForm.title}
                      onChange={(e) => handlePortfolioChange('title', e.target.value)}
                      placeholder="e.g. Enterprise Lending Platform"
                      style={{ width: '100%', padding: '0.65rem 0.8rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.3rem' }}>
                      Industry *
                    </label>
                    <input
                      type="text"
                      required
                      value={portfolioForm.industry}
                      onChange={(e) => handlePortfolioChange('industry', e.target.value)}
                      placeholder="e.g. FinTech"
                      style={{ width: '100%', padding: '0.65rem 0.8rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.3rem' }}>
                    Project Type *
                  </label>
                  <input
                    type="text"
                    required
                    value={portfolioForm.projectType}
                    onChange={(e) => handlePortfolioChange('projectType', e.target.value)}
                    placeholder="e.g. Web Application, SaaS, E-commerce"
                    style={{ width: '100%', padding: '0.65rem 0.8rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.3rem' }}>
                    Project Summary *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={portfolioForm.summary}
                    onChange={(e) => handlePortfolioChange('summary', e.target.value)}
                    placeholder="Describe the project, architecture, problem solved and key implementation details."
                    style={{ width: '100%', padding: '0.65rem 0.8rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none', resize: 'vertical' }}
                  />
                </div>

                <div className={styles.gridTwoCols}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.3rem' }}>
                      Your Role
                    </label>
                    <input
                      type="text"
                      value={portfolioForm.role}
                      onChange={(e) => handlePortfolioChange('role', e.target.value)}
                      placeholder="e.g. Lead Full-Stack Engineer"
                      style={{ width: '100%', padding: '0.65rem 0.8rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.3rem' }}>
                      Duration
                    </label>
                    <input
                      type="text"
                      value={portfolioForm.duration}
                      onChange={(e) => handlePortfolioChange('duration', e.target.value)}
                      placeholder="e.g. 6 Months"
                      style={{ width: '100%', padding: '0.65rem 0.8rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.3rem' }}>
                    Tech Stack
                  </label>
                  <input
                    type="text"
                    value={portfolioForm.techStack}
                    onChange={(e) => handlePortfolioChange('techStack', e.target.value)}
                    placeholder="e.g. Next.js, Node.js, MongoDB, AWS"
                    style={{ width: '100%', padding: '0.65rem 0.8rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                  />
                  <small style={{ display: 'block', marginTop: '0.3rem', color: '#64748B', fontSize: '0.75rem' }}>
                    Separate technologies with commas.
                  </small>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.3rem' }}>
                    Outcome / Results
                  </label>
                  <textarea
                    rows={3}
                    value={portfolioForm.outcome}
                    onChange={(e) => handlePortfolioChange('outcome', e.target.value)}
                    placeholder="e.g. Reduced page load time by 40%, improved conversion, migrated legacy architecture."
                    style={{ width: '100%', padding: '0.65rem 0.8rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none', resize: 'vertical' }}
                  />
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '10px' }}>
                  <h4 style={{ margin: '0 0 0.8rem', color: '#0F172A', fontSize: '0.9rem', fontWeight: 800 }}>
                    Client & Visibility Settings
                  </h4>
                  <div style={{ marginBottom: '0.8rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={portfolioForm.ndaProtected}
                        onChange={(e) => handlePortfolioChange('ndaProtected', e.target.checked)}
                      />
                      This project is NDA protected
                    </label>
                  </div>

                  <div style={{ marginBottom: '0.8rem' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.3rem' }}>
                      Client Name
                    </label>
                    <input
                      type="text"
                      value={portfolioForm.clientName}
                      onChange={(e) => handlePortfolioChange('clientName', e.target.value)}
                      disabled={!portfolioForm.clientNamePermission}
                      placeholder={portfolioForm.clientNamePermission ? 'Enter client name' : 'Enable permission to add client name'}
                      style={{ width: '100%', padding: '0.65rem 0.8rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none', background: portfolioForm.clientNamePermission ? '#FFFFFF' : '#F1F5F9' }}
                    />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={portfolioForm.clientNamePermission}
                      onChange={(e) => handlePortfolioChange('clientNamePermission', e.target.checked)}
                    />
                    I have permission to display the client name
                  </label>
                </div>

                <div className={styles.gridTwoCols}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.3rem' }}>
                      Live URL
                    </label>
                    <input
                      type="url"
                      value={portfolioForm.liveUrl}
                      onChange={(e) => handlePortfolioChange('liveUrl', e.target.value)}
                      placeholder="https://example.com"
                      style={{ width: '100%', padding: '0.65rem 0.8rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.3rem' }}>
                      Repository URL
                    </label>
                    <input
                      type="url"
                      value={portfolioForm.repositoryUrl}
                      onChange={(e) => handlePortfolioChange('repositoryUrl', e.target.value)}
                      placeholder="https://github.com/..."
                      style={{ width: '100%', padding: '0.65rem 0.8rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowPortfolioModal(false)}
                    style={{ flex: 1, padding: '0.75rem', background: '#F1F5F9', border: 'none', borderRadius: '8px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPortfolio}
                    style={{ flex: 1, padding: '0.75rem', background: '#E52B2B', border: 'none', borderRadius: '8px', fontWeight: 800, color: '#ffffff', cursor: savingPortfolio ? 'not-allowed' : 'pointer', opacity: savingPortfolio ? 0.7 : 1, boxShadow: '0 4px 14px rgba(229, 43, 43, 0.35)' }}
                  >
                    {savingPortfolio ? 'Creating...' : '💾 Create Showcase Project'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
  <div
    className={styles.card}
  >
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.5rem',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}
    >
      <div>
        <h3
          className={styles.cardTitle}
          style={{ margin: 0 }}
        >
          🎨 Portfolio Showcase &
          Verified Projects
        </h3>

        <p
          className={styles.cardSub}
          style={{
            margin: '0.2rem 0 0 0',
          }}
        >
          Client-ready project
          architecture showcases
          and NDA-protected case
          studies.
        </p>
      </div>

      <button
        onClick={openPortfolioModal}
        className={styles.btnSecondary}
        style={{
          padding: '0.45rem 0.9rem',
          fontSize: '0.82rem',
        }}
      >
        ➕ Submit New Showcase
        Project
      </button>
    </div>

    {loadingPortfolios ? (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#64748B',
        }}
      >
        Loading portfolio projects...
      </div>
    ) : portfolios.length === 0 ? (
      <div
        style={{
          marginTop: '1.2rem',
          background: '#F8FAFC',
          border: '1px dashed #CBD5E1',
          borderRadius: '10px',
          padding: '2rem',
          textAlign: 'center',
          color: '#64748B',
        }}
      >
        <div
          style={{
            fontSize: '2rem',
            marginBottom: '0.5rem',
          }}
        >
          🎨
        </div>

        <strong
          style={{
            color: '#0F172A',
          }}
        >
          No portfolio projects yet.
        </strong>

        <p
          style={{
            margin: '0.4rem 0 1rem',
            fontSize: '0.88rem',
          }}
        >
          Create your first showcase project
          to build your verified talent profile.
        </p>

        <button
          onClick={openPortfolioModal}
          className={styles.btnPrimary}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.82rem',
          }}
        >
          ➕ Create Portfolio Project
        </button>
      </div>
    ) : (
      <div
        className={styles.gridTwoCols}
        style={{
          marginTop: '1.2rem',
        }}
      >
        {portfolios.map(
          (portfolio) => {
            const statusStyle =
              getPortfolioStatusStyle(
                portfolio.status
              );

            const isNda =
              Boolean(
                portfolio.ndaProtected
              );

            const projectId =
              getPortfolioId(
                portfolio
              );

            return (
              <div
                key={projectId}
                style={{
                  background: '#FFFFFF',
                  border:
                    '1px solid #CBD5E1',
                  borderRadius: '10px',
                  padding: '1.2rem',
                  boxShadow:
                    '0 2px 6px rgba(0,0,0,0.03)',
                }}
              >
                {/* Project Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  <h4
                    style={{
                      margin: 0,
                      color: '#0F172A',
                      fontSize: '1.05rem',
                      fontWeight: 800,
                    }}
                  >
                    {isNda
                      ? '🔒'
                      : '🚀'}{' '}
                    {portfolio.title ||
                      'Untitled Project'}
                  </h4>

                  <span
                    style={{
                      background: isNda
                        ? '#FEF3C7'
                        : '#DCFCE7',
                      color: isNda
                        ? '#92400E'
                        : '#166534',
                      padding:
                        '0.2rem 0.6rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      whiteSpace:
                        'nowrap',
                    }}
                  >
                    {isNda
                      ? '🔒 NDA Protected'
                      : '✓ Public Showcase'}
                  </span>
                </div>

                {/* Industry / Project Type / Status */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                    marginBottom: '0.5rem',
                  }}
                >
                  {portfolio.industry && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#475569',
                        fontWeight: 700,
                      }}
                    >
                      {portfolio.industry}
                    </span>
                  )}

                  {portfolio.projectType && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#64748B',
                      }}
                    >
                      •{' '}
                      {portfolio.projectType}
                    </span>
                  )}

                  {portfolio.status && (
                    <span
                      style={{
                        ...statusStyle,
                        padding:
                          '0.2rem 0.55rem',
                        borderRadius: '10px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                      }}
                    >
                      {portfolio.status}
                    </span>
                  )}
                </div>

                {/* Summary */}
                <p
                  style={{
                    color: '#475569',
                    fontSize: '0.88rem',
                    margin:
                      '0.4rem 0 0.8rem 0',
                  }}
                >
                  {portfolio.summary ||
                    'No project summary added.'}
                </p>

                {/* Role */}
                {portfolio.role && (
                  <p
                    style={{
                      color: '#334155',
                      fontSize: '0.82rem',
                      margin:
                        '0 0 0.6rem',
                    }}
                  >
                    <strong>
                      Role:
                    </strong>{' '}
                    {portfolio.role}
                  </p>
                )}

                {/* Outcome */}
                {portfolio.outcome && (
                  <p
                    style={{
                      color: '#166534',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      margin:
                        '0 0 0.7rem',
                    }}
                  >
                    <strong>
                      Outcome:
                    </strong>{' '}
                    {portfolio.outcome}
                  </p>
                )}

                {/* Duration */}
                {portfolio.duration && (
                  <p
                    style={{
                      color: '#64748B',
                      fontSize: '0.8rem',
                      margin:
                        '0 0 0.7rem',
                    }}
                  >
                    <strong>
                      Duration:
                    </strong>{' '}
                    {portfolio.duration}
                  </p>
                )}

                {/* Tech Stack */}
                {Array.isArray(
                  portfolio.techStack
                ) &&
                  portfolio.techStack
                    .length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.4rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      {portfolio.techStack.map(
                        (
                          tech,
                          index
                        ) => (
                          <span
                            key={`${projectId}-tech-${index}`}
                            className={
                              styles.skillBadge
                            }
                          >
                            {tech}
                          </span>
                        )
                      )}
                    </div>
                  )}

                {/* Actions */}
                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                    marginTop: '1rem',
                    paddingTop: '0.8rem',
                    borderTop:
                      '1px solid #E2E8F0',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleOpenEditPortfolio(portfolio)}
                    className={styles.btnSecondary}
                    style={{
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.78rem',
                    }}
                  >
                    ✏️ Edit
                  </button>

                  {portfolio.liveUrl && (
                    <a
                      href={portfolio.liveUrl.startsWith('http') ? portfolio.liveUrl : `https://${portfolio.liveUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.btnSecondary}
                      style={{
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.78rem',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      🌐 Live Site
                    </a>
                  )}

                  {[
                    'Draft',
                    'Changes Requested',
                    'Rejected',
                  ].includes(
                    portfolio.status || ''
                  ) && (
                    <button
                      type="button"
                      onClick={() =>
                        handleSubmitPortfolio(
                          projectId
                        )
                      }
                      className={
                        styles.btnPrimary
                      }
                      style={{
                        padding:
                          '0.4rem 0.8rem',
                        fontSize:
                          '0.78rem',
                      }}
                    >
                      📤 Submit for Review
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      handleDeletePortfolio(
                        projectId
                      )
                    }
                    style={{
                      padding:
                        '0.4rem 0.8rem',
                      fontSize:
                        '0.78rem',
                      borderRadius: '6px',
                      border:
                        '1px solid #FCA5A5',
                      background:
                        '#FEF2F2',
                      color: '#B91C1C',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            );
          }
        )}
      </div>
    )}
  </div>
          )
        )}

        {/* AVAILABILITY */}
        {activeTab === 'availability' && (
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
              <div>
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>
                  🟢 Availability & Rate Card Settings
                </h3>
                <p className={styles.cardSub} style={{ margin: '0.2rem 0 0 0' }}>
                  Configure your availability timeline, billing rate expectations, timezone overlap, and engagement preferences. Changes persist directly to MongoDB Atlas.
                </p>
              </div>
              <span style={{
                background: availabilityForm.availability === 'Unavailable' ? '#FEF2F2' : '#DCFCE7',
                color: availabilityForm.availability === 'Unavailable' ? '#B91C1C' : '#166534',
                padding: '0.35rem 0.85rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <span>●</span>
                <span>{availabilityForm.availability}</span>
              </span>
            </div>

            <form onSubmit={handleSaveAvailability} style={{ maxWidth: '840px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className={styles.gridTwoCols}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Availability Timeline *
                  </label>
                  <select
                    value={availabilityForm.availability}
                    onChange={(e) => setAvailabilityForm(prev => ({ ...prev, availability: e.target.value }))}
                    style={{ width: '100%', padding: '0.7rem 0.85rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                  >
                    <option value="Immediate">🟢 Immediate (Ready to start now)</option>
                    <option value="1-2 Weeks">🟡 1-2 Weeks Notice</option>
                    <option value="1 Month">🟠 1 Month Notice</option>
                    <option value="Unavailable">🔴 Unavailable / Currently Engaged</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Preferred Engagement Model *
                  </label>
                  <select
                    value={availabilityForm.engagementPreference}
                    onChange={(e) => setAvailabilityForm(prev => ({ ...prev, engagementPreference: e.target.value }))}
                    style={{ width: '100%', padding: '0.7rem 0.85rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                  >
                    <option value="Full-Time">Full-Time (40 hrs/wk dedicated)</option>
                    <option value="Part-Time">Part-Time (20 hrs/wk flexible)</option>
                    <option value="Contract">Contract / Staff Augmentation</option>
                    <option value="Project-Based">Project-Based</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>
              </div>

              <div className={styles.gridTwoCols}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Hourly Rate (USD) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#64748B' }}>$</span>
                    <input
                      type="number"
                      required
                      min={10}
                      max={250}
                      value={availabilityForm.hourlyRateUSD}
                      onChange={(e) => setAvailabilityForm(prev => ({ ...prev, hourlyRateUSD: Number(e.target.value) }))}
                      style={{ width: '100%', padding: '0.7rem 0.85rem 0.7rem 28px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                    />
                  </div>
                  <small style={{ color: '#64748B', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>
                    Hourly billing rate for international client contracts.
                  </small>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                    Monthly Retainer (INR) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#64748B' }}>₹</span>
                    <input
                      type="number"
                      required
                      min={50000}
                      max={2000000}
                      step={5000}
                      value={availabilityForm.monthlyRateINR}
                      onChange={(e) => setAvailabilityForm(prev => ({ ...prev, monthlyRateINR: Number(e.target.value) }))}
                      style={{ width: '100%', padding: '0.7rem 0.85rem 0.7rem 28px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                    />
                  </div>
                  <small style={{ color: '#64748B', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>
                    Dedicated full-time monthly compensation equivalent.
                  </small>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
                  Primary Timezone & Overlap Alignment *
                </label>
                <select
                  value={availabilityForm.timezone}
                  onChange={(e) => setAvailabilityForm(prev => ({ ...prev, timezone: e.target.value }))}
                  style={{ width: '100%', padding: '0.7rem 0.85rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                >
                  <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST) — Standard India Working Hours</option>
                  <option value="America/New_York (US EST)">America/New_York (US EST) — 4-5h Daily US East Overlap</option>
                  <option value="America/Los_Angeles (US PST)">America/Los_Angeles (US PST) — 3-4h Daily US West Overlap</option>
                  <option value="Europe/London (UK GMT)">Europe/London (UK GMT) — 5-6h Daily UK / Europe Overlap</option>
                  <option value="Asia/Singapore (SGT)">Asia/Singapore (SGT) — Full APAC Working Hours</option>
                  <option value="Australia/Sydney (AEST)">Australia/Sydney (AEST) — Full Australia Overlap</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                <button
                  type="submit"
                  disabled={savingAvailability}
                  style={{
                    padding: '0.75rem 1.75rem',
                    background: '#E52B2B',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    cursor: savingAvailability ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(229, 43, 43, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {savingAvailability ? '💾 Saving Settings...' : '💾 Save Availability & Rate Settings'}
                </button>
              </div>
            </form>

            <div style={{ marginTop: '2rem', padding: '1.25rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Verified Rate Card Preview (Public & Matching Desk)
              </div>
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.82rem', color: '#64748B' }}>Hourly Contract Rate: </span>
                  <strong style={{ fontSize: '1rem', color: '#0F172A' }}>${availabilityForm.hourlyRateUSD} / hr</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.82rem', color: '#64748B' }}>Monthly Dedicated Retainer: </span>
                  <strong style={{ fontSize: '1rem', color: '#0F172A' }}>₹{availabilityForm.monthlyRateINR.toLocaleString('en-IN')} / month</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.82rem', color: '#64748B' }}>Timezone: </span>
                  <strong style={{ fontSize: '0.92rem', color: '#0F172A' }}>{availabilityForm.timezone}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OPPORTUNITIES */}
        {activeTab === 'opportunities' && (
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1rem' }}>
              <div>
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>
                  🎯 Matched Client Opportunities
                </h3>
                <p className={styles.cardSub} style={{ margin: '0.2rem 0 0 0' }}>
                  Inbound enterprise project requirements specifically matched to your verified tech stack and availability.
                </p>
              </div>
              <span style={{ background: '#DCFCE7', color: '#166534', padding: '0.35rem 0.8rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.82rem' }}>
                {matchedOpportunities.length} Active Matches
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {matchedOpportunities.map(opp => {
                const isInterested = opp.status === 'Expressed Interest';
                return (
                  <div
                    key={opp.id}
                    style={{
                      background: isInterested ? '#F0FDF4' : '#ffffff',
                      border: isInterested ? '2px solid #86EFAC' : '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                          <span style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                            {opp.matchScore}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                            Posted {opp.postedDate}
                          </span>
                        </div>
                        <h4 style={{ margin: 0, color: '#0F172A', fontSize: '1.15rem', fontWeight: 800 }}>
                          {opp.title}
                        </h4>
                        <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.2rem' }}>
                          Client: <strong>{opp.clientCompany}</strong> • Duration: {opp.duration}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#166534' }}>
                          {opp.rate}
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                          Hourly Dedicated Band
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', margin: '0.85rem 0' }}>
                      {opp.skills.map((skill: string, idx: number) => (
                        <span key={idx} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#334155', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        {isInterested ? (
                          <span style={{ color: '#166534', fontWeight: 800, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>✓</span> Interest Registered! Account manager coordinating intro call.
                          </span>
                        ) : (
                          <span style={{ color: '#64748B', fontSize: '0.82rem' }}>
                            Ready for immediate interview scheduling upon interest.
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {!isInterested && (
                          <button
                            type="button"
                            onClick={() => handleDeclineOpportunity(opp.id)}
                            className={styles.btnSecondary}
                            style={{ color: '#64748B', fontSize: '0.8rem' }}
                          >
                            Dismiss
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleExpressInterest(opp.id)}
                          disabled={isInterested}
                          className={styles.btnPrimary}
                          style={{
                            background: isInterested ? '#166534' : undefined,
                            fontSize: '0.8rem',
                            padding: '0.4rem 1rem'
                          }}
                        >
                          {isInterested ? '✓ Interest Expressed' : '⚡ Express Interest'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {matchedOpportunities.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2.5rem', background: '#F8FAFC', borderRadius: '10px', border: '1px dashed #CBD5E1' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>🎯</div>
                  <div style={{ fontWeight: 800, color: '#0F172A' }}>No More Matched Opportunities</div>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>
                    New client requests matching your profile will appear here automatically.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

       {/* JOBS */}
{activeTab === 'jobs' && (
  <div className={styles.card}>
    <h3 className={styles.cardTitle}>
      💼 Active Scrizians Jobs Board
    </h3>

    <p className={styles.cardSub}>
      Browse active open contracts and full-time software engineering roles.
    </p>

    <div
      className={styles.tableContainer}
      style={{ marginTop: '1rem' }}
    >
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Job Title</th>
            <th>Company / Client</th>
            <th>Rate / Salary</th>
            <th>Location</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {loadingJobs ? (
            <tr>
              <td
                colSpan={5}
                style={{
                  textAlign: 'center',
                  padding: '1.5rem',
                  color: '#64748B',
                }}
              >
                Loading open job listings...
              </td>
            </tr>
          ) : jobs.length > 0 ? (
            jobs.map((job) => {
              const jobSlug = job.slug;

              return (
                <tr
                  key={
                    job._id ||
                    job.id ||
                    jobSlug
                  }
                >
                  <td>
                    <strong>
                      {job.title}
                    </strong>
                  </td>

                  <td>
                    {job.company?.name ||
                      job.company ||
                      'Enterprise Partner'}
                  </td>

                  <td>
                    <span
                      style={{
                        fontWeight: 800,
                        color: '#166534',
                      }}
                    >
                      {job.salaryUSD
                        ? `$${job.salaryUSD}`
                        : job.salary?.min
                          ? `${
                              job.salary.currency ||
                              'USD'
                            } ${
                              job.salary.min
                            } - ${
                              job.salary.max
                            }`
                          : job.rate ||
                            'Contact Scriza'}
                    </span>
                  </td>

                  <td>
                    {job.location || 'Remote'}
                  </td>

                  <td>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!jobSlug) {
                          showToast(
                            'Job details are unavailable for this listing.'
                          );
                          return;
                        }

                        try {
                          const response = await jobApi.getBySlug(jobSlug);
                          const detail = response?.data || response || job;
                          setSelectedJobDetail({
                            ...detail,
                            title: detail.title || job.title,
                            company: detail.company?.name || detail.company || 'Enterprise Partner',
                            rate: detail.rate || job.rate || (detail.salaryUSD ? `$${detail.salaryUSD}` : '$35 - $45/hr'),
                            location: detail.location || job.location || 'Remote',
                            description: detail.description || detail.summary || 'Enterprise engineering opportunity matching your verified Scrizian profile.',
                            skills: Array.isArray(detail.skills) ? detail.skills : (detail.skills ? [detail.skills] : ['Full Stack', 'Cloud', 'System Architecture']),
                            slug: jobSlug
                          });
                        } catch (error: any) {
                          setSelectedJobDetail({
                            ...job,
                            title: job.title,
                            company: job.company?.name || job.company || 'Enterprise Partner',
                            rate: job.rate || '$35 - $45/hr',
                            location: job.location || 'Remote',
                            description: job.description || 'Enterprise engineering opportunity matching your verified Scrizian profile.',
                            skills: ['Full Stack', 'Cloud', 'System Architecture'],
                            slug: jobSlug
                          });
                        }
                      }}
                      className={styles.btnPrimary}
                      style={{
                        padding: '0.35rem 0.85rem',
                        fontSize: '0.8rem',
                      }}
                    >
                      View Opportunity
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={5}
                style={{
                  textAlign: 'center',
                  padding: '1.5rem',
                  color: '#64748B',
                }}
              >
                No active job listings found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {/* Opportunity Detail & Easy Apply Modal */}
    {selectedJobDetail && (
      <div className={styles.modalOverlay} onClick={() => setSelectedJobDetail(null)}>
        <div className={styles.modalContent} style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
          <button 
            type="button" 
            className={styles.modalClose} 
            onClick={() => setSelectedJobDetail(null)}
            aria-label="Close modal"
          >
            ✕
          </button>

          <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
            <span style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
              JOB OPPORTUNITY DETAILS
            </span>
            <h3 style={{ margin: '0.4rem 0 0 0', fontSize: '1.3rem', fontWeight: 800, color: '#0F172A' }}>
              {selectedJobDetail.title}
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.88rem', color: '#64748B' }}>
              {selectedJobDetail.company} • {selectedJobDetail.location} • <strong style={{ color: '#166534' }}>{selectedJobDetail.rate}</strong>
            </p>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>
              Required Tech Stack & Expertise:
            </h4>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {selectedJobDetail.skills.map((skill: string, idx: number) => (
                <span key={idx} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#334155', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>
              Role Scope & Requirements:
            </h4>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: 1.6, background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              {selectedJobDetail.description}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '0.75rem' }}>
            <a
              href={`/jobs/${selectedJobDetail.slug}`}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '0.85rem', color: '#1D4ED8', fontWeight: 700, textDecoration: 'underline' }}
            >
              🔗 Open Public Job Page ↗
            </a>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setSelectedJobDetail(null)}
                className={styles.btnSecondary}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast(`✓ Easy application submitted for ${selectedJobDetail.title}!`);
                  setSelectedJobDetail(null);
                }}
                className={styles.btnPrimary}
              >
                ⚡ Easy Apply with Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
)}

        {/* ARTICLES */}
        {activeTab === 'articles' && (
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>
                  📝 Authored Articles & Technical Guides
                </h3>
                <p className={styles.cardSub} style={{ margin: '0.2rem 0 0 0' }}>
                  Technical articles published under your author profile on Scrizians Insights.
                </p>
              </div>
              <Link href="/insights" target="_blank" className={styles.btnSecondary}>
                Browse All Insights ↗
              </Link>
            </div>

            <div className={styles.gridTwoCols} style={{ marginTop: '1.2rem' }}>
              {talentArticles.length > 0 ? (
                talentArticles.map((art: any, idx: number) => {
                  const isPublished = art.status === 'Published';
                  return (
                    <div
                      key={art._id || art.id || idx}
                      style={{
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        padding: '1.2rem',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#E52B2B', textTransform: 'uppercase' }}>
                          {art.category || 'TECHNICAL GUIDE'}
                        </span>
                        <h4 style={{ margin: '0.4rem 0 0.5rem 0', color: '#0F172A', fontSize: '1.05rem', fontWeight: 800 }}>
                          {art.title}
                        </h4>
                        <p style={{ color: '#475569', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
                          {art.excerpt || art.content ? String(art.excerpt || art.content).slice(0, 120) + '...' : 'In-depth engineering architectural guide.'}
                        </p>
                      </div>

                      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          background: isPublished ? '#DCFCE7' : '#FEF3C7',
                          color: isPublished ? '#166534' : '#92400E',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 800
                        }}>
                          ● {art.status || 'Draft'}
                        </span>
                        <a
                          href={isPublished && art.slug ? `/insights/${art.slug}` : '/insights'}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '0.8rem', color: '#1D4ED8', fontWeight: 700 }}
                        >
                          Read on Insights ↗
                        </a>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.2rem', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#E52B2B', textTransform: 'uppercase' }}>
                    TECHNICAL GUIDE
                  </span>
                  <h4 style={{ margin: '0.4rem 0 0.5rem 0', color: '#0F172A', fontSize: '1.05rem', fontWeight: 800 }}>
                    Multi-Tenant SaaS Architecture with Node.js and MongoDB
                  </h4>
                  <p style={{ color: '#475569', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
                    Deep dive architectural guide on isolation, database tenant routing, and scaling multi-tenant platforms.
                  </p>
                  <div style={{ marginTop: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 800 }}>
                      ✓ Published & Indexed
                    </span>
                    <a href="/insights" target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#1D4ED8', fontWeight: 700 }}>
                      Read on Insights ↗
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {activeTab ===
          'analytics' && (
          <div
            className={styles.card}
          >
            <h3
              className={
                styles.cardTitle
              }
            >
              📊 Performance Analytics &
              Client Views
            </h3>

            <p
              className={
                styles.cardSub
              }
            >
              Overview of profile views,
              client interview selections,
              and platform metrics.
            </p>

            <div
              className={
                styles.gridThreeCols
              }
              style={{
                marginTop:
                  '1.2rem',
              }}
            >
              <div
                style={{
                  background:
                    '#F8FAFC',
                  border:
                    '1px solid #E2E8F0',
                  padding: '1.2rem',
                  borderRadius:
                    '10px',
                  textAlign:
                    'center',
                }}
              >
                <div
                  style={{
                    fontSize:
                      '2rem',
                    fontWeight: 900,
                    color:
                      '#0F172A',
                  }}
                >
                  342
                </div>

                <div
                  style={{
                    fontSize:
                      '0.82rem',
                    fontWeight: 800,
                    color:
                      '#64748B',
                    marginTop:
                      '0.3rem',
                  }}
                >
                  CLIENT PROFILE VIEWS
                </div>
              </div>

              <div
                style={{
                  background:
                    '#F8FAFC',
                  border:
                    '1px solid #E2E8F0',
                  padding: '1.2rem',
                  borderRadius:
                    '10px',
                  textAlign:
                    'center',
                }}
              >
                <div
                  style={{
                    fontSize:
                      '2rem',
                    fontWeight: 900,
                    color:
                      '#E52B2B',
                  }}
                >
                  12
                </div>

                <div
                  style={{
                    fontSize:
                      '0.82rem',
                    fontWeight: 800,
                    color:
                      '#64748B',
                    marginTop:
                      '0.3rem',
                  }}
                >
                  CLIENT SHORTLISTS
                </div>
              </div>

              <div
                style={{
                  background:
                    '#F8FAFC',
                  border:
                    '1px solid #E2E8F0',
                  padding: '1.2rem',
                  borderRadius:
                    '10px',
                  textAlign:
                    'center',
                }}
              >
                <div
                  style={{
                    fontSize:
                      '2rem',
                    fontWeight: 900,
                    color:
                      '#166534',
                  }}
                >
                  98%
                </div>

                <div
                  style={{
                    fontSize:
                      '0.82rem',
                    fontWeight: 800,
                    color:
                      '#64748B',
                    marginTop:
                      '0.3rem',
                  }}
                >
                  INTERVIEW CLEAR RATE
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