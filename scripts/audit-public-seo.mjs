import fs from 'node:fs';
import path from 'node:path';

const publicRoot = path.resolve(process.cwd(), 'public');

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

const pages = walk(publicRoot)
  .filter((file) => file.endsWith('.html'))
  .map((file) => {
    const html = fs.readFileSync(file, 'utf8');
    const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)/i)?.[1] ?? null;
    const noindex = /<meta\s+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
    const language = html.match(/<html\s+lang=["']([^"']+)/i)?.[1] ?? null;
    const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1].trim() ?? null;
    const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)/i)?.[1] ?? null;
    const alternates = Object.fromEntries(
      [...html.matchAll(/<link\s+rel=["']alternate["']\s+hreflang=["']([^"']+)["']\s+href=["']([^"']+)/gi)]
        .map((match) => [match[1].toLowerCase(), match[2]])
    );
    const schemas = [...html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
      .map((match) => match[1].trim())
      .filter(Boolean);

    return {
      file: path.relative(publicRoot, file),
      canonical,
      noindex,
      language,
      title,
      description,
      alternates,
      schemas
    };
  });

const indexablePages = pages.filter((page) => !page.noindex);
const canonicalPages = indexablePages.filter((page) => page.canonical);
const sitemap = fs.readFileSync(path.join(publicRoot, 'sitemap.xml'), 'utf8');
const sitemapUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
const canonicalCounts = new Map();
const pagesByCanonical = new Map(canonicalPages.map((page) => [page.canonical, page]));
let hreflangLinksChecked = 0;

for (const page of canonicalPages) {
  canonicalCounts.set(page.canonical, (canonicalCounts.get(page.canonical) ?? 0) + 1);
}

const failures = [];

for (const page of indexablePages) {
  if (!page.title) failures.push(`${page.file}: missing title`);
  if (!page.description) failures.push(`${page.file}: missing meta description`);
  if (!page.canonical) failures.push(`${page.file}: missing canonical URL`);
  if (!page.language) failures.push(`${page.file}: missing html lang attribute`);

  page.schemas.forEach((schema, index) => {
    try {
      JSON.parse(schema);
    } catch (error) {
      failures.push(`${page.file}: invalid JSON-LD block ${index + 1} (${error.message})`);
    }
  });
}

for (const page of canonicalPages) {
  for (const [language, target] of Object.entries(page.alternates)) {
    hreflangLinksChecked += 1;
    const targetPage = pagesByCanonical.get(target);

    if (!targetPage) {
      failures.push(`${page.file}: hreflang ${language} target has no matching canonical page (${target})`);
      continue;
    }

    if (targetPage.noindex) {
      failures.push(`${page.file}: hreflang ${language} points to a noindex page (${target})`);
    }

    if (language !== 'x-default' && targetPage.language !== language) {
      failures.push(`${page.file}: hreflang ${language} target declares html lang ${targetPage.language || 'missing'} (${target})`);
    }

    if (language !== 'x-default' && targetPage.alternates[page.language] !== page.canonical) {
      failures.push(`${page.file}: hreflang ${language} target does not link back with hreflang ${page.language} (${target})`);
    }
  }
}

for (const [canonical, count] of canonicalCounts) {
  if (count > 1) failures.push(`${canonical}: used as the canonical URL by ${count} pages`);
}

for (const url of sitemapUrls) {
  if (!canonicalPages.some((page) => page.canonical === url)) {
    failures.push(`${url}: sitemap URL has no matching canonical public page`);
  }
}

const omittedCanonicalPages = canonicalPages.filter((page) => !sitemapUrls.has(page.canonical));

console.log(`SEO audit: ${pages.length} HTML files, ${canonicalPages.length} canonical indexable pages, ${sitemapUrls.size} sitemap URLs.`);
console.log(`Hreflang links checked: ${hreflangLinksChecked}.`);
console.log(`Canonical pages intentionally or currently omitted from sitemap: ${omittedCanonicalPages.length}.`);

if (failures.length) {
  console.error('\nSEO audit failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('SEO audit passed.');
