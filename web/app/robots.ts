import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api',
        '/login',
        '/register',
        '/me',
        '/submit',
        '/moderation',
        '/request-password-reset',
        '/reset-password',
        '/verify-email',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

