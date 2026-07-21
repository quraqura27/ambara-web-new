import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

const PERFORMANCE_CAPTION = "Operational Performance -- 2026 YTD";

export async function GET() {
  const homepagePath = path.join(process.cwd(), "public", "index.html");
  let html = await readFile(homepagePath, "utf8");

  html = html.replace(
    /(<div class="stat-number" id="stat-ontime">)[^<]*(<\/div>)/,
    "$199.6%$2",
  );

  const statsSectionPattern = /<!-- STATS -->([\s\S]*?)<\/section>/;
  html = html.replace(statsSectionPattern, (section) => {
    if (/class="[^"]*stats-remark[^"]*"/.test(section)) {
      return section.replace(
        /(<div[^>]*class="[^"]*stats-remark[^"]*"[^>]*>)[\s\S]*?(<\/div>)/,
        `$1${PERFORMANCE_CAPTION}$2`,
      );
    }

    const remark = `    <div class="stats-remark animate-on-scroll" style="margin-top:28px;text-align:center;font-size:0.8125rem;color:var(--text-muted)">${PERFORMANCE_CAPTION}</div>\n`;

    return section.replace(
      /(    <\/div>\r?\n)(  <\/div>\r?\n<\/section>)$/,
      `$1${remark}$2`,
    );
  });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
