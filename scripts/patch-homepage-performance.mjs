import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const homepagePath = path.join(process.cwd(), "public", "index.html");
const targetCaption = "Operational Performance -- 2026 YTD";

let html = await readFile(homepagePath, "utf8");
const statsSectionPattern = /<!-- STATS -->([\s\S]*?)<\/section>/;

if (!statsSectionPattern.test(html)) {
  throw new Error("Homepage stats section was not found.");
}

html = html.replace(statsSectionPattern, (section) => {
  let updated = section.replace(
    /(<div class="stat-number" id="stat-ontime">)[^<]*(<\/div>)/,
    `$1${targetCaption ? "99.6%" : "99.6%"}$2`,
  );

  if (!updated.includes('id="stat-ontime">99.6%</div>')) {
    throw new Error("Homepage on-time-rate element was not updated.");
  }

  if (/class="[^"]*stats-remark[^"]*"/.test(updated)) {
    return updated.replace(
      /(<div[^>]*class="[^"]*stats-remark[^"]*"[^>]*>)[\s\S]*?(<\/div>)/,
      `$1${targetCaption}$2`,
    );
  }

  const remark = `    <div class="stats-remark animate-on-scroll" style="margin-top:28px;text-align:center;font-size:0.8125rem;color:var(--text-muted)">${targetCaption}</div>\n`;

  return updated.replace(
    /(    <\/div>\r?\n)(  <\/div>\r?\n<\/section>)$/,
    `$1${remark}$2`,
  );
});

if (!html.includes(targetCaption)) {
  throw new Error("Homepage performance caption was not inserted.");
}

await writeFile(homepagePath, html, "utf8");
console.log("Homepage performance values patched.");
