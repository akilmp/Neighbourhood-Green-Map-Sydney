import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [{ url: siteUrl }];

  try {
    const [routesRes, spotsRes] = await Promise.all([
      fetch(`${apiBase}/routes`),
      fetch(`${apiBase}/spots`),
    ]);

    if (routesRes.ok) {
      const routes: { id: string }[] = await routesRes.json();
      urls.push(
        ...routes.map((r) => ({ url: `${siteUrl}/routes/${r.id}` }))
      );
    }

    if (spotsRes.ok) {
      const spots: { id: string }[] = await spotsRes.json();
      urls.push(
        ...spots.map((s) => ({ url: `${siteUrl}/spots/${s.id}` }))
      );
    }
  } catch {
    // ignore errors and return what we have
  }

  return urls;
}

