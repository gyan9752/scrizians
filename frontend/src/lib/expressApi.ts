/**
 * Scrizians Express Backend Unified API Client
 * Backend: http://localhost:5001/api/v1
 */

type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  [key: string]: any;
};

const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_EXPRESS_API_URL) {
    return process.env.NEXT_PUBLIC_EXPRESS_API_URL.replace(/\/+$/, '');
  }

  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return 'https://backend-two-wine-72.vercel.app/api/v1';
  }

  return 'http://localhost:5001/api/v1';
};

const getToken = (): string => {
  if (typeof window === 'undefined') return '';

  return localStorage.getItem('scrizians_token') || '';
};

const saveToken = (token?: string) => {
  if (typeof window === 'undefined' || !token) return;

  localStorage.setItem('scrizians_token', token);
};

const removeToken = () => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('scrizians_token');
};

const isAuthEndpoint = (endpoint: string) =>
  endpoint.startsWith('/auth/login') ||
  endpoint.startsWith('/auth/register') ||
  endpoint.startsWith('/auth/refresh') ||
  endpoint.startsWith('/auth/verify-2fa') ||
  endpoint.startsWith('/auth/2fa/') ||
  endpoint.startsWith('/auth/logout') ||
  endpoint.startsWith('/auth/forgot-password') ||
  endpoint.startsWith('/auth/verify-reset-code') ||
  endpoint.startsWith('/auth/reset-password');

const clearSession = () => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('scrizians_token');
  localStorage.removeItem('scrizians_user');
};

/*
 * Session is really gone (refresh failed): clear local state and,
 * if the person is inside a dashboard, send them to the login page
 * instead of leaving an empty dashboard on screen.
 */
const handleSessionExpired = () => {
  if (typeof window === 'undefined') return;

  clearSession();

  if (window.location.pathname.startsWith('/dashboard')) {
    window.location.replace('/login?session=expired');
  }
};

/*
 * Single-flight refresh: when many requests get a 401 together
 * (dashboards fire 8-10 calls at once) only ONE refresh call is
 * made and everybody waits for its result. Without this, the
 * refresh-token rotation on the backend sees several calls with
 * the same cookie and kills the session.
 */
let refreshInFlight: Promise<string | null> | null = null;

const refreshAccessToken = (): Promise<string | null> => {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        const json = await response.json().catch(() => ({}));
        const newToken = json?.data?.accessToken || json?.accessToken;

        if (response.ok && newToken) {
          saveToken(newToken);
          return newToken as string;
        }

        return null;
      } catch {
        return null;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
};

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<ApiResponse<T>> {
  try {
    const token = getToken();

    const headers: Record<string, string> = {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = token.startsWith('Bearer ')
        ? token
        : `Bearer ${token}`;
    }

    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    let result: ApiResponse<T>;

    try {
      result = await response.json();
    } catch {
      result = {
        success: false,
        error: `Request failed with status ${response.status}`,
      };
    }

    /*
     * Access token expired: refresh once (shared by all callers) and
     * retry. If another request/tab already refreshed meanwhile, the
     * stored token differs from the one we sent, so just retry.
     */
    if (
      response.status === 401 &&
      retry &&
      !isAuthEndpoint(endpoint)
    ) {
      const currentToken = getToken();
      const alreadyRefreshed = !!currentToken && currentToken !== token;

      const freshToken = alreadyRefreshed
        ? currentToken
        : await refreshAccessToken();

      if (freshToken) {
        return request<T>(endpoint, options, false);
      }

      handleSessionExpired();
    }

    if (!response.ok) {
      return {
        ...result,
        success: false,
        status: response.status,
        error:
          result.error ||
          result.message ||
          `Request failed with status ${response.status}`,
      } as ApiResponse<T> & { status: number };
    }

    return result;
  } catch (error: any) {
    console.warn(
      `Express API Error [${endpoint}]:`,
      error?.message
    );

    return {
      success: false,
      error: error?.message || 'Network request failed',
    };
  }
}

/* =========================================================
   AUTH
========================================================= */

export const authApi = {
  login: async (credentials: any) => {
    const result = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    const token =
      result.data?.accessToken ||
      result.accessToken;

    if (result.success && token) {
      saveToken(token);
    }

    return result;
  },

  setup2FA: (challengeToken: string) =>
    request('/auth/2fa/setup', {
      method: 'POST',
      body: JSON.stringify({ challengeToken }),
    }),

  verify2FA: async (data: { challengeToken: string; twoFactorCode: string }) => {
    const result = await request('/auth/verify-2fa', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    const token =
      result.data?.accessToken ||
      result.accessToken;

    if (result.success && token) {
      saveToken(token);
    }

    return result;
  },

  register: async (userData: any) => {
    const result = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    const token =
      result.data?.accessToken ||
      result.accessToken;

    if (result.success && token) {
      saveToken(token);
    }

    return result;
  },

  refresh: async () => {
    const result = await request(
      '/auth/refresh',
      {
        method: 'POST',
      },
      false
    );

    const token =
      result.data?.accessToken ||
      result.accessToken;

    if (result.success && token) {
      saveToken(token);
    }

    return result;
  },

  logout: async () => {
    const result = await request('/auth/logout', {
      method: 'POST',
    });

    removeToken();

    return result;
  },

  logoutAll: async () => {
    const result = await request('/auth/logout-all', {
      method: 'POST',
    });

    removeToken();

    return result;
  },

  getMe: () => request('/auth/me'),

  updateProfile: (data: any) =>
    request('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  forgotPassword: (email: string) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyResetCode: (email: string, otpCode: string) =>
    request('/auth/verify-reset-code', {
      method: 'POST',
      body: JSON.stringify({ email, otpCode }),
    }),

  resetPassword: (data: { email: string; resetToken: string; newPassword: string }) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

/* =========================================================
   TALENT
========================================================= */

export const talentApi = {
  getAll: (params = '') =>
    request(`/talent${params ? `?${params}` : ''}`),

  getByScrizianId: (scrizianId: string) =>
    request(`/talent/${scrizianId}`),

  getMyProfile: () =>
    request('/talent/profile/me', { method: 'GET' }),

  createProfile: (data: any) =>
    request('/talent/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProfile: (data: any) =>
    request('/talent/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  submitVerification: () =>
    request('/talent/profile/submit-verification', {
      method: 'POST',
    }),

  create: (data: any) =>
    request('/talent', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    request(`/talent/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request(`/talent/${id}`, {
      method: 'DELETE',
    }),
};

/* =========================================================
   LEADS
========================================================= */

export const leadApi = {
  create: (data: any) =>
    request('/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: (params = '') =>
    request(`/leads${params ? `?${params}` : ''}`),

  update: (id: string, data: any) =>
    request(`/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request(`/leads/${id}`, {
      method: 'DELETE',
    }),
};

/* =========================================================
   JOBS
========================================================= */

export const jobApi = {
  getAll: (params = '') =>
    request(`/jobs${params ? `?${params}` : ''}`),

  getBySlug: (slug: string) =>
    request(`/jobs/${slug}`),

  getMyApplications: () =>
    request('/jobs/applications/mine'),

  apply: (slug: string, data: any) =>
    request(`/jobs/${slug}/apply`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  withdrawApplication: (applicationId: string) =>
    request(`/jobs/applications/${applicationId}/withdraw`, {
      method: 'PATCH',
    }),

  adminGetApplications: (params = '') =>
    request(`/jobs/admin/applications/all${params ? `?${params}` : ''}`),

  adminUpdateApplicationStatus: (applicationId: string, status: string) =>
    request(`/jobs/admin/applications/${applicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  create: (data: any) =>
    request('/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    request(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request(`/jobs/${id}`, {
      method: 'DELETE',
    }),
};

/* =========================================================
   REQUIREMENTS
========================================================= */

export const requirementApi = {
  getAll: (params = '') =>
    request(`/requirements${params ? `?${params}` : ''}`),

  getById: (id: string) =>
    request(`/requirements/${id}`),

  create: (data: any) =>
    request('/requirements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    request(`/requirements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  submit: (id: string) =>
    request(`/requirements/${id}/submit`, {
      method: 'POST',
    }),

  delete: (id: string) =>
    request(`/requirements/${id}`, {
      method: 'DELETE',
    }),
};

/* =========================================================
   SHORTLIST
========================================================= */

export const shortlistApi = {
  getAll: (params = '') =>
    request(`/shortlists${params ? `?${params}` : ''}`),

  getByRequirement: (requirementId: string) =>
    request(`/shortlists/requirement/${requirementId}`),

  add: (data: any) =>
    request('/shortlists', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: string) =>
    request(`/shortlists/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  remove: (id: string) =>
    request(`/shortlists/${id}`, {
      method: 'DELETE',
    }),
};

/* =========================================================
   INTERVIEWS
========================================================= */

export const interviewApi = {
  getAll: (params = '') =>
    request(`/interviews${params ? `?${params}` : ''}`),

  request: (data: any) =>
    request('/interviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: string) =>
    request(`/interviews/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  cancel: (id: string) =>
    request(`/interviews/${id}`, {
      method: 'DELETE',
    }),
};

/* =========================================================
   PORTFOLIOS
========================================================= */

export const portfolioApi = {
  getPublic: (params = '') =>
    request(`/portfolios${params ? `?${params}` : ''}`),

  getBySlug: (slug: string) =>
    request(`/portfolios/${slug}`),

  getAll: (params = '') =>
    request(`/portfolios/mine/list${params ? `?${params}` : ''}`),

  review: (id: string, data: any) =>
    request(`/portfolios/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  create: (data: any) =>
    request('/portfolios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    request(`/portfolios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  submit: (id: string) =>
    request(`/portfolios/${id}/submit`, {
      method: 'POST',
    }),

  delete: (id: string) =>
    request(`/portfolios/${id}`, {
      method: 'DELETE',
    }),
};

/* =========================================================
   CASE STUDIES
========================================================= */

export const caseStudyApi = {
  getAll: (params = '') =>
    request(`/case-studies${params ? `?${params}` : ''}`),

  getBySlug: (slug: string) =>
    request(`/case-studies/${slug}`),

  create: (data: any) =>
    request('/case-studies', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adminList: (params = '') =>
    request(`/case-studies/admin/list/all${params ? `?${params}` : ''}`),

  update: (id: string, data: any) =>
    request(`/case-studies/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  review: (id: string, data: any) =>
    request(`/case-studies/admin/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  publish: (id: string) =>
    request(`/case-studies/admin/${id}/publish`, {
      method: 'PATCH',
    }),

  delete: (id: string) =>
    request(`/case-studies/admin/${id}`, {
      method: 'DELETE',
    }),
};

/* =========================================================
   PRICING
========================================================= */

export const pricingApi = {
  getPublic: () =>
    request('/pricing'),

  getConfig: () =>
    request('/pricing/admin'),

  updateConfig: (data: any) =>
    request('/pricing/admin', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateCurrency: (data: any) =>
    request('/pricing/admin/currency', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

/* =========================================================
   COMPANIES
========================================================= */

export const companyApi = {
  getMine: () =>
    request('/companies/me'),

  create: (data: any) =>
    request('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMine: (data: any) =>
    request('/companies/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

/* =========================================================
   ENGAGEMENTS
========================================================= */

export const engagementApi = {
  getAll: (params = '') =>
    request(`/engagements${params ? `?${params}` : ''}`),

  create: (data: any) =>
    request('/engagements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getById: (id: string) =>
    request(`/engagements/${id}`),

  updateStatus: (id: string, status: string) =>
    request(`/engagements/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  delete: (id: string) =>
    request(`/engagements/${id}`, {
      method: 'DELETE',
    }),
};

/* =========================================================
   AUTHORS
========================================================= */

export const authorApi = {
  getAll: () =>
    request('/authors'),

  create: (data: any) =>
    request('/authors', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () =>
    request('/authors/me'),

  updateMe: (data: any) =>
    request('/authors/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  approve: (id: string) =>
    request(`/authors/admin/${id}/approve`, {
      method: 'PATCH',
    }),
};

/* =========================================================
   ARTICLES
========================================================= */

export const articleApi = {
  getAll: (params = '') =>
    request(`/articles${params ? `?${params}` : ''}`),

  getBySlug: (slug: string) =>
    request(`/articles/${slug}`),

  create: (data: any) =>
    request('/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMine: (params = '') =>
    request(`/articles/mine/list${params ? `?${params}` : ''}`),

  update: (id: string, data: any) =>
    request(`/articles/mine/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request(`/articles/mine/${id}`, {
      method: 'DELETE',
    }),


  adminUpdate: (id: string, data: any) =>
    request(`/articles/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  adminDelete: (id: string) =>
    request(`/articles/admin/${id}`, {
      method: 'DELETE',
    }),

  submit: (id: string) =>
    request(`/articles/mine/${id}/submit`, {
      method: 'POST',
    }),

  adminList: (params = '') =>
    request(`/articles/admin/list/all${params ? `?${params}` : ''}`),

  workflow: (id: string, status: string) =>
    request(`/articles/admin/${id}/workflow`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  schedule: (id: string, scheduledAt: string) =>
    request(`/articles/admin/${id}/schedule`, {
      method: 'PATCH',
      body: JSON.stringify({ scheduledAt }),
    }),

  publish: (id: string) =>
    request(`/articles/admin/${id}/publish`, {
      method: 'PATCH',
    }),
};

/* =========================================================
   EDITORIAL
========================================================= */

export const editorialApi = {
  getRevisions: (articleId: string) =>
    request(`/articles/admin/${articleId}/revisions`),

  getComments: (articleId: string) =>
    request(`/articles/admin/${articleId}/comments`),

  addComment: (articleId: string, data: any) =>
    request(`/articles/admin/${articleId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resolveComment: (articleId: string, commentId: string) =>
    request(`/articles/admin/${articleId}/comments/${commentId}/resolve`, {
      method: 'PATCH',
    }),
};

/* =========================================================
   NOTIFICATIONS
========================================================= */

export const notificationApi = {
  getAll: (params = '') =>
    request(`/notifications${params ? `?${params}` : ''}`),

  markRead: (id: string) =>
    request(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),

  markAllRead: () =>
    request('/notifications/read-all', {
      method: 'PATCH',
    }),
};

/* =========================================================
   ADMIN
========================================================= */

export const adminApi = {
  getStats: () =>
    request('/admin/stats'),

  approveTalent: (scrizianId: string) =>
    request(`/admin/talent/${scrizianId}/approve`, {
      method: 'PATCH',
    }),

  getRequirements: (params = '') =>
    request(`/admin/requirements${params ? `?${params}` : ''}`),

  reviewRequirement: (
    id: string,
    data: any
  ) =>
    request(`/admin/requirements/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteRequirement: (id: string) =>
    request(`/admin/requirements/${id}`, {
      method: 'DELETE',
    }),


  getUsers: (params = '') =>
    request(`/admin/users${params ? `?${params}` : ''}`),

  createUser: (data: any) =>
    request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUser: (id: string, data: any) =>
    request(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteUser: (id: string) =>
    request(`/admin/users/${id}`, {
      method: 'DELETE',
    }),
};

export { request as fetchApi };