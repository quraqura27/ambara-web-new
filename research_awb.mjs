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
    console.log(`\n=== FILE: ${s} ===`);
    const data = new Uint8Array(fs.readFileSync(s));
    const loadingTask = pdfjsLib.getDocument({data});
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    
    const rows = {};
    textContent.items.forEach(i => {
      const y = i.transform[5].toFixed(1);
      if (!rows[y]) rows[y] = [];
      rows[y].push(i);
    });

    const sortedY = Object.keys(rows).sort((a,b) => parseFloat(b) - parseFloat(a));
    
    sortedY.forEach(y => {
      const rowItems = rows[y].sort((a,b) => a.transform[4] - b.transform[4]);
      const text = rowItems.map(i => i.str).join(' ');
      
      // Look for Shipper (Top)
      if (parseFloat(y) > 750 && text.length > 5) {
         console.log(`[SHIPPER CANDIDATE] Y: ${y} | Text: ${text}`);
      }
      
      // Look for Consignee (Mid)
      if (parseFloat(y) > 600 && parseFloat(y) < 750 && text.length > 5) {
         if (text.match(/SURYAGITA|MALIK|DAMATRANS|WAHANA|CV|PT/i)) {
            console.log(`[CONSIGNEE CANDIDATE] Y: ${y} | Text: ${text}`);
         }
      }

      // Look for Weight row
      if (text.match(/126|807|888|975|175|263|19\.0/)) {
         console.log(`[DATA ROW] Y: ${y} | Text: ${text}`);
         rowItems.forEach(i => {
           if (/[\d,.]+/.test(i.str)) {
             console.log(`    -> [${i.str}] at X: ${i.transform[4].toFixed(1)}`);
           }
         });
      }
    });
  }
}
run();
