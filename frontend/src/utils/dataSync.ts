/**
 * Scrizians Real-Time Data Sync Engine
 * Canonical dataset, version control migration, and synchronization layer connecting website forms, public pages, Admin CRM, and Contributor portals.
 */

import { addNotification } from './notificationSync';
import { leadApi, talentApi, jobApi, articleApi, portfolioApi } from '@/lib/expressApi';
import { adapters } from '@/lib/adapters';

const CURRENT_DATA_VERSION = 'scrizians_v4_unified_2026';

export const initialLeadsList: any[] = [];
export const initialTalentList: any[] = [];
export const initialJobsList: any[] = [];
export const initialArticlesList: any[] = [];

export const getStoredData = (key: string, fallback: any[]) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const data = localStorage.getItem(key);
    if (data === null) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (e) {
    return fallback;
  }
};

/**
 * Pull a list from the Express backend, adapt it to the UI shape and cache it in
 * localStorage (pages read the cache and re-render on `scrizians_storage_updated`).
 */
export const syncFromMongoDB = async (key: string) => {
  if (typeof window === 'undefined') return;

  const sources: Record<string, { fetch: () => Promise<any>; adapt: string }> = {
    scrizians_leads_list: { fetch: () => leadApi.getAll(), adapt: 'leads' },
    scrizians_talent_list: { fetch: () => talentApi.getAll('limit=100'), adapt: 'talent' },
    scrizians_jobs_list: { fetch: () => jobApi.getAll('limit=100'), adapt: 'jobs' },
    scrizians_insights_list: { fetch: () => articleApi.getAll(), adapt: 'articles' },
    scrizians_portfolio_list: { fetch: () => portfolioApi.getPublic(), adapt: 'portfolios' },
  };

  const source = sources[key];
  if (!source) return;

  try {
    const res = await source.fetch();
    if (res?.success && Array.isArray(res.data)) {
      const adapt = adapters[source.adapt];
      const newDataStr = JSON.stringify(res.data.map(adapt));
      if (newDataStr !== localStorage.getItem(key)) {
        localStorage.setItem(key, newDataStr);
        window.dispatchEvent(new Event('scrizians_storage_updated'));
      }
    }
  } catch (err) {
    console.warn(`Sync error [${key}]:`, err);
  }
};

export const syncAllFromMongoDB = () => {
  if (typeof window === 'undefined') return;
  syncFromMongoDB('scrizians_talent_list');
  syncFromMongoDB('scrizians_jobs_list');
  syncFromMongoDB('scrizians_insights_list');
  syncFromMongoDB('scrizians_portfolio_list');
  // Leads are staff-only; the call simply fails (401) for non-staff users.
  if (localStorage.getItem('scrizians_token')) syncFromMongoDB('scrizians_leads_list');
};

export const saveStoredData = (key: string, data: any[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event('scrizians_storage_updated'));
  } catch (e) {
    console.error('Storage error:', e);
  }
};

export const deleteStoredData = (key: string, id: string, updatedList: any[]) => {
  if (typeof window === 'undefined') return;
  saveStoredData(key, updatedList);

  // Only portfolios have a delete endpoint reachable from the admin UI.
  if (key === 'scrizians_portfolio_list') {
    portfolioApi.delete(id).catch((err) => console.warn('Delete portfolio error:', err));
  }
};

export const addInboundLead = async (leadData: Partial<{
  name: string; email: string; phone: string; company: string;
  serviceRequested: string; message: string; scrizianIdReferenced: string; source: string;
}>) => {
  if (typeof window === 'undefined') return;

  const payload = {
    name: leadData.name || '',
    email: leadData.email || '',
    phone: leadData.phone || '',
    company: leadData.company || '',
    serviceRequested: leadData.serviceRequested || 'Talent Requirement Inquiry',
    scrizianIdReferenced: leadData.scrizianIdReferenced && leadData.scrizianIdReferenced !== 'N/A'
      ? leadData.scrizianIdReferenced
      : '',
    message: leadData.message || '',
    source: leadData.source || (typeof window !== 'undefined' ? window.location.pathname : 'website'),
  };

  const result = await leadApi.create(payload);

  if (result.success) {
    addNotification({
      title: 'New Inbound Client Lead',
      message: `${payload.name} (${payload.company || 'N/A'}) submitted a new inquiry.`,
      type: 'lead',
      link: '/dashboard/admin',
    });
  }

  return result;
};
