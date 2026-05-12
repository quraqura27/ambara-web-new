import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const HOST = "www.ambaraartha.com";
const SITE_URL = `https://${HOST}`;
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow";
const KEY = "e06fc41d76a01948bd9179297d13acc0";
const KEY_FILE = `${KEY}.txt`;
const KEY_LOCATION = `${SITE_URL}/${KEY_FILE}`;
const SITEMAP_PATH = path.join(process.cwd(), "public", "sitemap.xml");

function parseArgs(argv) {
  const args = {
    sitemap: false,
    dryRun: false,
    urls: [],
  };

  for (const arg of argv) {
    if (arg === "--sitemap") args.sitemap = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else args.urls.push(arg);
  }

  return args;
}

async function readSitemapUrls() {
  const xml = await fs.readFile(SITEMAP_PATH, "utf8");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
}

function normalizeUrl(input) {
  const url = new URL(input, SITE_URL);
  if (url.protocol !== "https:") {
    throw new Error(`Only https URLs are allowed: ${input}`);
  }
  if (url.hostname !== HOST) {
    throw new Error(`Only ${HOST} URLs are allowed: ${input}`);
  }
  url.hash = "";
  return url.toString();
}

async function getStatus(url, redirects = 4) {
  const response = await fetch(url, {
    method: "HEAD",
    redirect: "manual",
    headers: {
      "user-agent": "Ambara IndexNow submitter",
    },
  });

  if ([301, 302, 303, 307, 308].includes(response.status) && redirects > 0) {
    const location = response.headers.get("location");
    if (!location) return response.status;
    return getStatus(new URL(location, url).toString(), redirects - 1);
  }

  return response.status;
}

async function filterLiveUrls(urls) {
  const live = [];
  const rejected = [];

  for (const rawUrl of urls) {
    const url = normalizeUrl(rawUrl);
    const status = await getStatus(url);
    if (status >= 200 && status < 400) live.push(url);
    else rejected.push({ url, status });
  }

  return { live: [...new Set(live)], rejected };
}

async function submitIndexNow(urlList, dryRun) {
  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  };

  if (dryRun) {
    return {
      dryRun: true,
      status: 0,
      payload,
    };
  }

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
      "user-agent": "Ambara IndexNow submitter",
    },
    body: JSON.stringify(payload),
  });

  return {
    dryRun: false,
    status: response.status,
    ok: response.ok,
    responseText: await response.text(),
  };
}

const args = parseArgs(process.argv.slice(2));

if (!args.sitemap && args.urls.length === 0) {
  console.error("Usage: npm run indexnow -- <url...> [--dry-run]");
  console.error("   or: npm run indexnow -- --sitemap [--dry-run]");
  process.exit(1);
}

const requestedUrls = args.sitemap ? await readSitemapUrls() : args.urls;
const { live, rejected } = await filterLiveUrls(requestedUrls);

if (!live.length) {
  console.error(JSON.stringify({ submitted: 0, rejected }, null, 2));
  process.exit(1);
}

const result = await submitIndexNow(live, args.dryRun);

console.log(JSON.stringify({
  endpoint: INDEXNOW_ENDPOINT,
  host: HOST,
  keyLocation: KEY_LOCATION,
  requested: requestedUrls.length,
  submitted: live.length,
  rejected,
  result,
}, null, 2));

if (!args.dryRun && ![200, 202].includes(result.status)) {
  process.exit(1);
}
