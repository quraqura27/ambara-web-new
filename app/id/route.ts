import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  const homepagePath = path.join(process.cwd(), "public", "id", "index.html");
  const source = await readFile(homepagePath, "utf8");

  const html = source
    .replace('<div class="stat-number" id="stat-ontime">—</div>', '<div class="stat-number" id="stat-ontime">99.6%</div>')
    .replace(
      "</body>",
      `<script>
        (function () {
          function applyPerformanceStats() {
            var onTimeRate = document.getElementById('stat-ontime');
            if (onTimeRate) onTimeRate.textContent = '99.6%';

            var statsGrid = document.querySelector('.grid-4');
            if (!statsGrid) return;

            var remark = document.querySelector('.stats-remark');
            if (!remark) {
              remark = document.createElement('div');
              remark.className = 'stats-remark animate-on-scroll';
              remark.style.marginTop = '28px';
              remark.style.textAlign = 'center';
              remark.style.fontSize = '0.8125rem';
              remark.style.color = 'var(--text-muted)';
              statsGrid.insertAdjacentElement('afterend', remark);
            }
            remark.textContent = 'Operational Performance -- 2026 YTD';
          }

          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', applyPerformanceStats);
          } else {
            applyPerformanceStats();
          }
          window.setTimeout(applyPerformanceStats, 100);
          window.setTimeout(applyPerformanceStats, 1000);
        })();
      </script>\n</body>`,
    );

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
