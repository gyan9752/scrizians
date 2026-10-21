import { MetadataRoute } from 'next';

const API = process.env.NEXT_PUBLIC_EXPRESS_API_URL || (process.env.NODE_ENV === 'production' ? 'https://backend-two-wine-72.vercel.app/api/v1' : 'http://localhost:5001/api/v1');

async function list(path: string): Promise<any[]> {
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate: 3600 } });
    const json = await res.json();
    return json?.success && Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://scrizians.com';
  const currentDate = new Date().toISOString();

  const staticRoutes = [
    '',
    '/hire-talent',
    '/talent',
    '/solutions',
    '/technologies',
    '/case-studies',
    '/jobs',
    '/insights',
    '/portfolio',
    '/pricing',
    '/about',
    '/about-scriza',
    '/hire-developers-from-india',
    '/contact',
    '/become-a-scrizian',
    '/write-for-scrizians',
    '/sitemap',
    '/policies/privacy',
    '/policies/terms',
    '/policies/talent-terms',
    '/policies/client-terms',
    '/policies/contributor-policy',
    '/policies/portfolio-policy',
    '/policies/cookie-policy',
    '/policies/acceptable-use',
    '/policies/refund-policy',
    '/policies/disclaimer',
    '/policies/grievance',
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : (route.startsWith('/policies') ? 0.5 : 0.8),
  }));

  // Dynamic routes from the Express backend (Talent, Jobs, Insights, Portfolio)
  let dynamicEntries: MetadataRoute.Sitemap = [];
  try {
    const [talents, jobs, insights, portfolios] = await Promise.all([
      list('/talent?limit=100'),
      list('/jobs?limit=100'),
      list('/articles'),
      list('/portfolios'),
    ]);

    const talentEntries: MetadataRoute.Sitemap = talents.map((t: any) => ({
      url: `${baseUrl}/talent/${t.scrizianId}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    const jobEntries: MetadataRoute.Sitemap = jobs.map((j: any) => ({
      url: `${baseUrl}/jobs/${j.slug}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    const insightEntries: MetadataRoute.Sitemap = insights.map((i: any) => ({
      url: `${baseUrl}/insights/${i.slug}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    const portfolioEntries: MetadataRoute.Sitemap = portfolios.map((p: any) => ({
      url: `${baseUrl}/portfolio/${p.slug}`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    }));

    dynamicEntries = [...talentEntries, ...jobEntries, ...insightEntries, ...portfolioEntries];
  } catch (err) {
    console.warn('Sitemap dynamic routes fetch error:', err);
  }

  return [...staticEntries, ...dynamicEntries];
}
