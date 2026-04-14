import * as fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function extractStats(filePath) {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const loadingTask = pdfjsLib.getDocument({data});
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    const items = textContent.items;

    // Look specifically at the middle section where pieces/weight live
    // Roughly Y: 150-450
    const cargoTable = items
        .filter(i => i.transform[5] > 150 && i.transform[5] < 450)
        .sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4]);

    console.log(`\n--- CARGO TABLE DUMP: ${filePath} ---`);
    cargoTable.forEach(i => {
        console.log(`[X:${Math.round(i.transform[4])}, Y:${Math.round(i.transform[5])}] "${i.str}"`);
    });
}

const files = ['./awb_samples/126-96273133.pdf', './awb_samples/807-46065176.pdf', './awb_samples/888-10034404.pdf', './awb_samples/975-25865755.pdf'];

async function run() {
    for (const file of files) {
        await extractStats(file);
    }
}
run();
