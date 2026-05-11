import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenv.config({ path: ".env.local", quiet: true });

const SITE_URL = "https://www.ambaraartha.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

const root = process.cwd();
const publicDir = path.join(root, "public");
const blogDir = path.join(publicDir, "blog");
const idBlogDir = path.join(publicDir, "id", "blog");
const blogIndexPath = path.join(publicDir, "blog.html");
const idBlogIndexPath = path.join(publicDir, "id", "blog.html");
const sitemapPath = path.join(publicDir, "sitemap.xml");
const blogSourcePath = path.join(root, "content", "blog-posts.json");

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripHtml(value = "") {
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactDescription(...values) {
  const text = values.map(stripHtml).find(Boolean) || "Air freight insights from PT Ambara Artha Globaltrans.";
  return text.length > 160 ? `${text.slice(0, 157).trim()}...` : text;
}

function safeJsonLd(data) {
  return JSON.stringify(data, null, 2).replace(/<\//g, "<\\/");
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string") return tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  return [];
}

function formatDate(value, locale) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function compactPlainText(value = "", maxLength = 150) {
  const text = stripHtml(value);
  return text.length > maxLength ? `${text.slice(0, maxLength - 3).trim()}...` : text;
}

function renderBlogIndexCard(post, lang) {
  const isId = lang === "id";
  const title = isId ? post.title_id : post.title_en;
  const excerpt = isId
    ? post.excerpt_id || post.meta_description_id || post.excerpt_en || post.meta_description_en
    : post.excerpt_en || post.meta_description_en;
  const locale = isId ? "id-ID" : "en-US";
  const route = `/${lang}/blog/${post.slug}`;
  const imageHtml = post.cover_image_url
    ? `      <img src="${escapeHtml(post.cover_image_url)}" alt="${escapeHtml(title)}" style="width:100%;height:200px;object-fit:cover;border-radius:12px;margin-bottom:20px">\n`
    : "";
  const category = post.category || "guides";

  return `    <article class="card animate-on-scroll" data-static-blog-card="${escapeHtml(post.slug)}">
${imageHtml}      <div class="badge badge-blue" style="margin-bottom:16px">${escapeHtml(category)}</div>
      <h3 style="font-size:1.125rem;margin-bottom:12px"><a href="${route}" style="color:inherit;text-decoration:none">${escapeHtml(title)}</a></h3>
      <p style="font-size:0.875rem;margin-bottom:20px">${escapeHtml(compactPlainText(excerpt))}</p>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;gap:16px">
        <span style="font-size:0.8125rem;color:var(--text-muted)">${escapeHtml(formatDate(post.published_at, locale))}</span>
        <a href="${route}" class="btn btn-sm btn-outline">${isId ? "Baca" : "Read"} &rarr;</a>
      </div>
    </article>`;
}

function replaceBetweenMarkers(html, startMarker, endMarker, replacement) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Missing static blog card markers: ${startMarker} / ${endMarker}`);
  }
  return `${html.slice(0, start + startMarker.length)}\n${replacement}\n      ${html.slice(end)}`;
}

async function writeBlogIndexCards(filePath, posts, lang) {
  const localizedPosts = lang === "id"
    ? posts.filter((post) => post.content_id && post.title_id)
    : posts.filter((post) => post.content_en && post.title_en);
  const cardsHtml = localizedPosts.map((post) => renderBlogIndexCard(post, lang)).join("\n");
  const startMarker = "<!-- STATIC_BLOG_CARDS_START -->";
  const endMarker = "<!-- STATIC_BLOG_CARDS_END -->";
  let html = await fs.readFile(filePath, "utf8");
  html = html.replace(/<div class="grid-3" id="blog-grid"(?: data-static-rendered="true" data-static-count="\d+")?>/, `<div class="grid-3" id="blog-grid" data-static-rendered="true" data-static-count="${localizedPosts.length}">`);
  html = replaceBetweenMarkers(html, startMarker, endMarker, cardsHtml);
  await fs.writeFile(filePath, html, "utf8");
  return localizedPosts.length;
}

function renderPostPage(post, lang) {
  const isId = lang === "id";
  const slug = post.slug;
  const title = isId ? post.title_id || post.title_en : post.title_en;
  const content = isId ? post.content_id || post.content_en : post.content_en;
  const excerpt = isId ? post.excerpt_id || post.excerpt_en : post.excerpt_en;
  const metaTitle = (isId ? post.meta_title_id || post.meta_title_en : post.meta_title_en) || title;
  const explicitMetaDescription = isId ? post.meta_description_id : post.meta_description_en;
  const metaDescription = explicitMetaDescription
    ? stripHtml(explicitMetaDescription)
    : compactDescription(excerpt, content);
  const route = `/${lang}/blog/${slug}`;
  const canonical = `${SITE_URL}${route}`;
  const alternateLinks = [
    `  <link rel="alternate" hreflang="en" href="${SITE_URL}/en/blog/${slug}">`,
    post.content_id
      ? `  <link rel="alternate" hreflang="id" href="${SITE_URL}/id/blog/${slug}">`
      : "",
  ].filter(Boolean).join("\n");
  const image = post.cover_image_url || DEFAULT_IMAGE;
  const tags = normalizeTags(post.tags);
  const locale = isId ? "id-ID" : "en-US";
  const published = post.published_at ? new Date(post.published_at).toISOString() : undefined;
  const modified = post.updated_at ? new Date(post.updated_at).toISOString() : published;
  const coverImageHtml = post.cover_image_url
    ? `        <img src="${escapeHtml(post.cover_image_url)}" alt="${escapeHtml(title)}" style="width:100%;border-radius:16px;margin-bottom:40px">\n`
    : "";
  const tagsHtml = tags.length
    ? `        <div style="margin-top:40px;padding-top:24px;border-top:1px solid var(--border);display:flex;gap:8px;flex-wrap:wrap">${tags.map((tag) => `<span class="badge badge-blue">${escapeHtml(tag)}</span>`).join("")}</div>\n`
    : "";
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: metaDescription,
    image,
    author: {
      "@type": "Organization",
      name: post.author || "Ambara Artha Team",
    },
    publisher: {
      "@type": "Organization",
      name: "PT Ambara Artha Globaltrans",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
    },
    datePublished: published,
    dateModified: modified,
    mainEntityOfPage: canonical,
    url: canonical,
  };

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(metaTitle)} | PT Ambara Artha Globaltrans</title>
  <meta name="description" content="${escapeHtml(metaDescription)}">
  <link rel="canonical" href="${canonical}">
${alternateLinks}
  <meta property="og:title" content="${escapeHtml(metaTitle)} | PT Ambara Artha Globaltrans">
  <meta property="og:description" content="${escapeHtml(metaDescription)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:image" content="${escapeHtml(image)}">
  <script type="application/ld+json">${safeJsonLd(schema)}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
  <style>
    .prose h2 { font-size: 1.5rem; margin: 40px 0 16px; }
    .prose h3 { font-size: 1.25rem; margin: 32px 0 12px; }
    .prose p { margin-bottom: 20px; color: var(--text-muted); }
    .prose ul, .prose ol { margin: 0 0 20px 24px; color: var(--text-muted); line-height: 1.75; }
    .prose li { margin-bottom: 8px; }
    .prose strong { color: var(--text); }
    .prose blockquote { border-left: 3px solid var(--blue); padding: 16px 20px; background: rgba(17,34,238,0.05); border-radius: 0 8px 8px 0; margin: 24px 0; }
    .prose table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    .prose th { background: var(--surface2); padding: 12px 16px; text-align: left; font-size: 0.875rem; }
    .prose td { padding: 12px 16px; border-bottom: 1px solid var(--border); font-size: 0.9375rem; color: var(--text-muted); }
    .prose img { max-width: 100%; height: auto; border-radius: 8px; margin: 32px 0; }
    .article-shell { padding-top: 120px; }
    .article-meta { display: flex; align-items: center; gap: 16px; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
  </style>
</head>
<body>
<div id="navbar-mount"></div>

<main class="article-shell">
  <article>
    <section style="padding:40px 0 60px">
      <div class="container" style="max-width:760px">
        <div style="margin-bottom:24px">
          <a href="/${lang}/blog" style="color:var(--text-muted);font-size:0.875rem">${isId ? "Kembali ke Blog" : "Back to Blog"}</a>
        </div>
        <div style="margin-bottom:20px">
          <div class="badge badge-blue" style="margin-bottom:20px">${escapeHtml(post.category || "guides")}</div>
          <h1 style="margin:0">${escapeHtml(title)}</h1>
        </div>
        <div class="article-meta">
          <div style="width:40px;height:40px;border-radius:50%;background:var(--blue);display:flex;align-items:center;justify-content:center;font-weight:800;color:white">A</div>
          <div>
            <div style="font-weight:600">${escapeHtml(post.author || "Ambara Artha Team")}</div>
            <div style="font-size:0.8125rem;color:var(--text-muted)">${escapeHtml(formatDate(post.published_at, locale))}</div>
          </div>
        </div>
${coverImageHtml}
        <div class="prose">${content || ""}</div>
${tagsHtml}
      </div>
    </section>
    <section class="section-sm">
      <div class="container" style="max-width:760px">
        <div class="card" style="text-align:center;background:linear-gradient(135deg,var(--surface),rgba(17,34,238,0.05))">
          <h2 style="margin-bottom:12px">${isId ? "Siap Mengirim?" : "Ready to Ship?"}</h2>
          <p style="margin-bottom:24px">${isId ? "Hubungi tim Ambara Artha untuk dukungan kargo udara, dokumen, dan koordinasi lokal Indonesia." : "Contact Ambara Artha for air freight, documentation, and local Indonesia cargo coordination."}</p>
          <a href="/${lang}/quote" class="btn btn-primary">${isId ? "Minta Penawaran" : "Request a Quote"}</a>
        </div>
      </div>
    </section>
  </article>
</main>

<div id="footer-mount"></div>
<script src="/layout.js?v=2.2"></script>
<script src="/app.js?v=2.2"></script>
<script>
document.getElementById('navbar-mount').innerHTML = AMBARA.getNavbar('blog');
document.getElementById('footer-mount').innerHTML = AMBARA.getFooter();
</script>
</body>
</html>
`;
}

function removeGeneratedBlogUrls(sitemap) {
  return sitemap.replace(/\s*<url>\s*<loc>https:\/\/(?:www\.)?ambaraartha\.com\/(?:en|id)\/blog\/[^<]+<\/loc>\s*<changefreq>monthly<\/changefreq>\s*<priority>0\.6<\/priority>\s*<\/url>/g, "");
}

function appendBlogUrls(sitemap, posts) {
  const urls = posts.flatMap((post) => [
    `  <url>
    <loc>${SITE_URL}/en/blog/${post.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`,
    post.content_id
      ? `  <url>
    <loc>${SITE_URL}/id/blog/${post.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
      : "",
  ]).filter(Boolean).join("\n");

  return sitemap.replace("</urlset>", `${urls}\n</urlset>`);
}

function isPublished(post) {
  if (post.status !== "published") return false;
  if (!post.scheduled_at) return true;
  return new Date(post.scheduled_at) <= new Date();
}

function sortPosts(posts) {
  return [...posts].sort((a, b) => {
    const aDate = new Date(a.published_at || a.created_at || 0).getTime();
    const bDate = new Date(b.published_at || b.created_at || 0).getTime();
    return bDate - aDate;
  });
}

async function readPostsFromFile() {
  const data = JSON.parse(await fs.readFile(blogSourcePath, "utf8"));
  return sortPosts((data.posts || []).filter(isPublished));
}

async function readPostsFromDatabase() {
  const databaseUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL or NETLIFY_DATABASE_URL is required.");
  }

  const sql = neon(databaseUrl);
  const posts = await sql`
    SELECT *
    FROM blog_posts
    WHERE status = 'published'
      AND (scheduled_at IS NULL OR scheduled_at <= NOW())
    ORDER BY published_at DESC
  `;
  return posts;
}

async function loadPosts() {
  if (process.env.BLOG_POST_SOURCE === "file") {
    return { posts: await readPostsFromFile(), source: "file" };
  }

  try {
    return { posts: await readPostsFromDatabase(), source: "database" };
  } catch (error) {
    console.warn(`Database blog source unavailable, using ${path.relative(root, blogSourcePath)}: ${error.message}`);
    return { posts: await readPostsFromFile(), source: "file-fallback" };
  }
}

const { posts, source } = await loadPosts();

await fs.mkdir(blogDir, { recursive: true });
await fs.mkdir(idBlogDir, { recursive: true });

for (const post of posts) {
  await fs.writeFile(path.join(blogDir, `${post.slug}.html`), renderPostPage(post, "en"), "utf8");
  if (post.content_id) {
    await fs.writeFile(path.join(idBlogDir, `${post.slug}.html`), renderPostPage(post, "id"), "utf8");
  }
}

const englishIndexCards = await writeBlogIndexCards(blogIndexPath, posts, "en");
const indonesianIndexCards = await writeBlogIndexCards(idBlogIndexPath, posts, "id");

const sitemap = await fs.readFile(sitemapPath, "utf8");
await fs.writeFile(sitemapPath, appendBlogUrls(removeGeneratedBlogUrls(sitemap), posts), "utf8");

console.log(JSON.stringify({
  source,
  publishedPosts: posts.length,
  englishGenerated: posts.length,
  indonesianGenerated: posts.filter((post) => post.content_id).length,
  englishIndexCards,
  indonesianIndexCards,
}, null, 2));
