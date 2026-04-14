import * as fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const samples = [
  './awb_samples/126-96273133.pdf',
  './awb_samples/807-46065176.pdf',
  './awb_samples/888-10034404.pdf',
  './awb_samples/975-25865755.pdf'
];

async function d(p) {
    const data = new Uint8Array(fs.readFileSync(p));
    const loadingTask = pdfjsLib.getDocument({data});
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    console.log(`\n=== ${p} ===`);
    
    // Sort items by Y then X
    const items = textContent.items.sort((a,b) => {
        const ya = Math.round(a.transform[5]);
        const yb = Math.round(b.transform[5]);
        if (ya !== yb) return yb - ya;
        return a.transform[4] - b.transform[4];
    });

    items.forEach(i => {
       if (i.transform[5] > 500) {
          console.log(`X: ${i.transform[4].toFixed(1)} | Y: ${i.transform[5].toFixed(1)} | [${i.str}]`);
       }
    });
}

async function run() {
    for (const s of samples) await d(s);
}
run();
