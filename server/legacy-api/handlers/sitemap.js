const { getDB } = require('../lib/db');

exports.handler = async (event) => {
  const sql = getDB();
  const BASE = 'https://ambaraartha.com';

  const staticPages = [
    { path: '/en/', priority: '1.0', changefreq: 'weekly' },
    { path: '/id/', priority: '1.0', changefreq: 'weekly' },
    { path: '/en/services.html', priority: '0.9', changefreq: 'monthly' },
    { path: '/id/services.html', priority: '0.9', changefreq: 'monthly' },
    { path: '/en/about.html', priority: '0.8', changefreq: 'monthly' },
    { path: '/id/about.html', priority: '0.8', changefreq: 'monthly' },
    { path: '/en/network.html', priority: '0.8', changefreq: 'monthly' },
    { path: '/id/network.html', priority: '0.8', changefreq: 'monthly' },
    { path: '/en/blog.html', priority: '0.9', changefreq: 'daily' },
    { path: '/id/blog.html', priority: '0.9', changefreq: 'daily' },
    { path: '/en/faq.html', priority: '0.8', changefreq: 'weekly' },
    { path: '/id/faq.html', priority: '0.8', changefreq: 'weekly' },
    { path: '/en/quote.html', priority: '0.9', changefreq: 'monthly' },
    { path: '/id/quote.html', priority: '0.9', changefreq: 'monthly' },
    { path: '/en/contact.html', priority: '0.8', changefreq: 'monthly' },
    { path: '/id/contact.html', priority: '0.8', changefreq: 'monthly' },
    { path: '/en/partners.html', priority: '0.7', changefreq: 'monthly' },
    { path: '/id/partners.html', priority: '0.7', changefreq: 'monthly' },
  ];

  let blogUrls = '';
  try {
    const posts = await sql`SELECT slug, updated_at, published_at FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC`;
    blogUrls = posts.map(p => `
  <url>
    <loc>${BASE}/en/blog/${p.slug}</loc>
    <lastmod>${new Date(p.updated_at || p.published_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${BASE}/en/blog/${p.slug}"/>
    <xhtml:link rel="alternate" hreflang="id" href="${BASE}/id/blog/${p.slug}"/>
  </url>`).join('');
  } catch {}

  const staticUrls = staticPages.map(p => `
  <url>
    <loc>${BASE}${p.path.replace('.html', '')}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${staticUrls}
${blogUrls}
</urlset>`;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=86400' },
    body: sitemap
  };
};


