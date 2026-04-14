import * as fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const samples = [
  './awb_samples/126-96273133.pdf',
  './awb_samples/807-46065176.pdf',
  './awb_samples/888-10034404.pdf',
  './awb_samples/975-25865755.pdf'
];

async function run() {
  for (const s of samples) {
    console.log(`\n=== SCANNING ${s} ===`);
    const data = new Uint8Array(fs.readFileSync(s));
    const loadingTask = pdfjsLib.getDocument({data});
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    
    // Group by row to see the alignment
    const rows = {};
    textContent.items.forEach(i => {
      const y = Math.round(i.transform[5]);
      if (!rows[y]) rows[y] = [];
      rows[y].push(i);
    });

    Object.keys(rows).sort((a,b) => b-a).forEach(y => {
      const row = rows[y].sort((a,b) => a.transform[4] - b.transform[4]);
      const text = row.map(i => i.str).join('');
      if (/\d+/.test(text) && text.length < 100) {
         console.log(`Y: ${y} | Text: ${text}`);
         row.forEach(i => {
           if (/[\d.]+/.test(i.str)) {
             console.log(`  -> [${i.str}] at X: ${i.transform[4].toFixed(1)}`);
           }
         });
      }
    });
  }
}
run();
