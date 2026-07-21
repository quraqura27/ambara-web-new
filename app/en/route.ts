import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-static";

export async function GET() {
  const homepagePath = path.join(process.cwd(), "public", "index.html");
  const source = await readFile(homepagePath, "utf8");

  const html = source
    .replace(
      '<div class="stat-number" id="stat-ontime">98.5%</div>',
      '<div class="stat-number" id="stat-ontime">99.6%</div>',
    )
    .replace(
      "</body>",
      `<script>
        document.addEventListener('DOMContentLoaded', function () {
          var onTimeRate = document.getElementById('stat-ontime');
          if (onTimeRate) onTimeRate.textContent = '99.6%';

          var remark = document.querySelector('.stats-remark');
          if (remark) remark.textContent = 'Operational Performance -- 2026 YTD';
        });
      </script>\n</body>`,
    );

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
