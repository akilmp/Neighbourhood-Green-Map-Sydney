import { describe, it, expect, vi, afterEach } from 'vitest';
import type { MetadataRoute } from 'next';
import sitemap from '../app/sitemap';
import robots from '../app/robots';

const apiBase = 'http://localhost:3001';
const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

function sitemapToXml(entries: MetadataRoute.Sitemap): string {
  const body = entries
    .map((u) => `  <url><loc>${u.url}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}

describe('sitemap metadata route', () => {
  it('lists routes and spots', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([{ id: 'r1' }]) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([{ id: 's1' }]) });
    global.fetch = fetchMock as unknown as typeof fetch;

    const xml = sitemapToXml(await sitemap());

    expect(fetchMock).toHaveBeenNthCalledWith(1, `${apiBase}/routes`);
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${apiBase}/spots`);
    expect(xml).toContain('<loc>http://localhost:3000/routes/r1</loc>');
    expect(xml).toContain('<loc>http://localhost:3000/spots/s1</loc>');
  });
});

function robotsToText(data: MetadataRoute.Robots): string {
  const rules = Array.isArray(data.rules) ? data.rules : [data.rules];
  const lines: string[] = [];
  for (const rule of rules) {
    lines.push(`User-agent: ${rule.userAgent}`);
    const allow = Array.isArray(rule.allow) ? rule.allow : rule.allow ? [rule.allow] : [];
    const disallow = Array.isArray(rule.disallow) ? rule.disallow : rule.disallow ? [rule.disallow] : [];
    allow.forEach((a) => lines.push(`Allow: ${a}`));
    disallow.forEach((d) => lines.push(`Disallow: ${d}`));
  }
  if (data.sitemap) lines.push(`Sitemap: ${data.sitemap}`);
  return lines.join('\n');
}

describe('robots metadata route', () => {
  it('blocks unwanted paths and sets sitemap', () => {
    const text = robotsToText(robots());
    expect(text).toContain('Disallow: /login');
    expect(text).toContain('Disallow: /register');
    expect(text).toContain('Sitemap: http://localhost:3000/sitemap.xml');
  });
});

