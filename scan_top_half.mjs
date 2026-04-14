import * as fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const samples = [
  './awb_samples/126-96273133.pdf',
  './awb_samples/807-46065176.pdf',
  './awb_samples/888-10034404.pdf',
  './awb_samples/975-25865755.pdf'
];

async function scan(p) {
    const data = new Uint8Array(fs.readFileSync(p));
    const loadingTask = pdfjsLib.getDocument({data});
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    console.log(`\n\n=== [${p}] Top Region Analysis ===`);
    
    // Sort items primarily by Y (desc) then X (asc)
    const items = textContent.items.sort((a,b) => {
        const ya = Math.round(a.transform[5] / 8) * 8; // Group by 8px lines
        const yb = Math.round(b.transform[5] / 8) * 8;
        if (ya !== yb) return yb - ya;
        return a.transform[4] - b.transform[4];
    });

    let currentY = -1;
    let currentRow = "";
    
    items.forEach(i => {
        if (i.transform[5] < 500) return; // Only top half
        
        const y = Math.round(i.transform[5] / 8) * 8;
        if (y !== currentY) {
            if (currentRow) console.log(`Y: ${currentY.toFixed(0)} | ${currentRow}`);
            currentY = y;
            currentRow = "";
        }
        currentRow += i.str + " ";
    });
    if (currentRow) console.log(`Y: ${currentY.toFixed(0)} | ${currentRow}`);
}

async function run() {
    for (const s of samples) await scan(s);
}
run();
