/**
 * Adapters: convert Express backend responses into the shapes the UI components expect.
 * Keep all backend -> UI field mapping here so pages stay free of API details.
 */

const initials = (name: string = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || 'SC';

export const adaptTalent = (t: any) => ({
  ...t,
  id: t.scrizianId,
  name: t.displayName,
  category: (t.categories && t.categories[0]) || t.role || 'Engineering',
  avatarText: initials(t.displayName),
  status: 'Verified',
});

export const adaptJob = (j: any) => {
  const typeKey = j.type || 'Full-Time';
  return {
    ...j,
    id: j.slug || j._id,
    dept: String(j.department || 'Engineering').toUpperCase(),
    typeBadge: typeKey.replace('-', ' '),
    typeKey: typeKey === 'Full-Time' ? 'Full-time' : typeKey === 'Part-Time' ? 'Part-time' : typeKey,
    experience: j.experienceLevel,
    skills: Array.isArray(j.requirements) ? j.requirements.slice(0, 5) : [],
    rate: j.salaryRangeUSD,
    salaryUSD: j.salaryRangeUSD,
    salaryINR: j.salaryRangeINR,
  };
};

export const adaptArticle = (a: any) => ({
  ...a,
  id: a.slug || a._id,
  category: a.category,
  author: a.author?.displayName || 'Scrizians Editorial',
  publishedDate: a.publishedAt
    ? new Date(a.publishedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '',
  readTime: a.content ? `${Math.max(1, Math.round(String(a.content).split(/\s+/).length / 200))} min read` : '6 min read',
  coverImageUrl: a.featuredImage,
  status: 'Published',
});

export const adaptPortfolio = (p: any) => ({
  ...p,
  id: p.slug || p._id || p.id,
  scrizianId: p.talent?.scrizianId || p.scrizianId || 'SCR-8841',
  authorRole: p.role || p.talent?.title || 'Lead Specialist',
  imageUrl: (p.media && p.media[0] && p.media[0].url) || p.coverImageUrl || 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=70',
  skills: Array.isArray(p.techStack) ? p.techStack : (typeof p.techStack === 'string' ? p.techStack.split(',') : [])
});

export const adaptLead = (l: any) => ({
  ...l,
  id: l._id,
});

export const adapters: Record<string, (x: any) => any> = {
  talent: adaptTalent,
  jobs: adaptJob,
  articles: adaptArticle,
  portfolios: adaptPortfolio,
  leads: adaptLead,
};
