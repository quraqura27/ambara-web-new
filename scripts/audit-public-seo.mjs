import fs from 'node:fs';
import path from 'node:path';

const publicRoot = path.resolve(process.cwd(), 'public');

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function resolvePublicTarget(target) {
  const pathname = target.split(/[?#]/)[0];
  if (pathname === '/en' || pathname === '/en/') return 'index.html';
  if (pathname === '/id' || pathname === '/id/') return 'id/index.html';
  if (pathname.startsWith('/en/')) return `${pathname.slice(4)}.html`;
  if (pathname.startsWith('/id/')) return `id/${pathname.slice(4)}.html`;
  return pathname.slice(1);
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
    const openGraph = {
      title: html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']*)/i)?.[1] ?? null,
      description: html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']*)/i)?.[1] ?? null,
      url: html.match(/<meta\s+property=["']og:url["']\s+content=["']([^"']*)/i)?.[1] ?? null,
      type: html.match(/<meta\s+property=["']og:type["']\s+content=["']([^"']*)/i)?.[1] ?? null,
      image: html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']*)/i)?.[1] ?? null
    };
    const alternates = Object.fromEntries(
      [...html.matchAll(/<link\s+rel=["']alternate["']\s+hreflang=["']([^"']+)["']\s+href=["']([^"']+)/gi)]
        .map((match) => [match[1].toLowerCase(), match[2]])
    );
    const schemas = [...html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
      .map((match) => match[1].trim())
      .filter(Boolean);
    const publicReferences = [...html.matchAll(/(?:href|src)=["']([^"']+)["']/gi)]
      .map((match) => match[1])
      .filter((target) => target.startsWith('/') && !target.startsWith('//') && !target.includes('${'));
    const newTabLinks = [...html.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)]
      .map((match) => match[0]);

    return {
      file: path.relative(publicRoot, file),
      canonical,
      noindex,
      language,
      title,
      description,
      openGraph,
      alternates,
      schemas,
      publicReferences,
      newTabLinks
    };
  });

const indexablePages = pages.filter((page) => !page.noindex);
const canonicalPages = indexablePages.filter((page) => page.canonical);
const sitemap = fs.readFileSync(path.join(publicRoot, 'sitemap.xml'), 'utf8');
const sitemapUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
const canonicalCounts = new Map();
const titleCounts = new Map();
const descriptionCounts = new Map();
const pagesByCanonical = new Map(canonicalPages.map((page) => [page.canonical, page]));
let hreflangLinksChecked = 0;
let openGraphSetsChecked = 0;
let publicReferencesChecked = 0;
let newTabLinksChecked = 0;

for (const page of canonicalPages) {
  canonicalCounts.set(page.canonical, (canonicalCounts.get(page.canonical) ?? 0) + 1);
  titleCounts.set(page.title, [...(titleCounts.get(page.title) ?? []), page.file]);
  descriptionCounts.set(page.description, [...(descriptionCounts.get(page.description) ?? []), page.file]);
}

const failures = [];

for (const page of indexablePages) {
  if (!page.title) failures.push(`${page.file}: missing title`);
  if (!page.description) failures.push(`${page.file}: missing meta description`);
  if (!page.canonical) failures.push(`${page.file}: missing canonical URL`);
  if (!page.language) failures.push(`${page.file}: missing html lang attribute`);

  for (const target of page.publicReferences) {
    publicReferencesChecked += 1;
    const resolvedTarget = resolvePublicTarget(target);
    if (!fs.existsSync(path.join(publicRoot, resolvedTarget))) {
      failures.push(`${page.file}: local reference does not resolve (${target})`);
    }
  }

  for (const link of page.newTabLinks) {
    newTabLinksChecked += 1;
    if (!/\brel=["'][^"']*\bnoopener\b[^"']*["']/i.test(link)) {
      failures.push(`${page.file}: target="_blank" link is missing rel="noopener"`);
    }
  }

  const missingOpenGraph = Object.entries(page.openGraph)
    .filter(([, value]) => !value)
    .map(([field]) => `og:${field}`);

  if (missingOpenGraph.length) {
    failures.push(`${page.file}: missing Open Graph metadata (${missingOpenGraph.join(', ')})`);
  } else {
    openGraphSetsChecked += 1;
    if (page.openGraph.url !== page.canonical) {
      failures.push(`${page.file}: og:url does not match canonical URL`);
    }
  }

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

for (const [title, files] of titleCounts) {
  if (title && files.length > 1) {
    failures.push(`duplicate title used by ${files.join(', ')} (${title})`);
  }
}

for (const [description, files] of descriptionCounts) {
  if (description && files.length > 1) {
    failures.push(`duplicate meta description used by ${files.join(', ')} (${description})`);
  }
}

for (const url of sitemapUrls) {
  if (!canonicalPages.some((page) => page.canonical === url)) {
    failures.push(`${url}: sitemap URL has no matching canonical public page`);
  }
}

const omittedCanonicalPages = canonicalPages.filter((page) => !sitemapUrls.has(page.canonical));

console.log(`SEO audit: ${pages.length} HTML files, ${canonicalPages.length} canonical indexable pages, ${sitemapUrls.size} sitemap URLs.`);
console.log(`Hreflang links checked: ${hreflangLinksChecked}.`);
console.log(`Complete Open Graph metadata sets checked: ${openGraphSetsChecked}.`);
console.log(`Local page and asset references checked: ${publicReferencesChecked}.`);
console.log(`New-tab links checked: ${newTabLinksChecked}.`);
console.log(`Canonical pages intentionally or currently omitted from sitemap: ${omittedCanonicalPages.length}.`);

if (failures.length) {
  console.error('\nSEO audit failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('SEO audit passed.');
