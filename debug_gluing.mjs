import * as fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function run() {
    const data = new Uint8Array(fs.readFileSync('./awb_samples/975-25865755.pdf'));
    const loadingTask = pdfjsLib.getDocument({data});
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    
    const row340 = textContent.items.filter(i => Math.abs(i.transform[5] - 340.3) < 2).sort((a,b) => a.transform[4] - b.transform[4]);
    
    console.log("=== RAW ITEMS AT Y: 340.3 ===");
    row340.forEach(i => console.log(`X: ${i.transform[4].toFixed(1)} | Str: [${i.str}] | Width: ${i.width}`));

    // Simulate current gluing logic
    const words = [];
    let curr = null;
    row340.forEach(it => {
       const s = it.str.trim(); if (!s) return;
       // We use it.width or fallback to length*6
       const width = it.width || s.length * 5; // Reduced fallback to be tighter
       if (!curr || it.transform[4] - curr.ex > 5) {
          if (curr) words.push(curr);
          curr = { s, x: it.transform[4], ex: it.transform[4] + width, y: it.transform[5] };
       } else {
          curr.s += s;
          curr.ex = it.transform[4] + width;
       }
    });
    if (curr) words.push(curr);
    
    console.log("\n=== GLUED WORDS ===");
    words.forEach(w => console.log(`X: ${w.x.toFixed(1)} | Text: [${w.s}] | EX: ${w.ex.toFixed(1)}`));
}
run();
