import * as fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function deepAudit(filePath) {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const loadingTask = pdfjsLib.getDocument({data});
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    const items = textContent.items;

    // PHYSICAL RECONSTRUCTION
    const getRegion = (minY, maxY, minX, maxX) => {
        return items
            .filter(i => i.transform[5] >= minY && i.transform[5] <= maxY && i.transform[4] >= minX && i.transform[4] <= maxX)
            .sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4])
            .map(i => i.str)
            .join(' ')
            .replace(/([A-Z0-9&',./|-])\s([A-Z0-9&',./|-])\s(?=[A-Z0-9&',./|-])/gi, '$1$2')
            .replace(/([A-Z0-9&',./|-])\s(?=[A-Z0-9&',./|-])/gi, '$1')
            .replace(/\s+/g, ' ')
            .trim();
    };

    console.log(`\n--- DEEP AUDIT: ${filePath} ---`);
    console.log(`CARRIER ZONE (Top Mid): ${getRegion(750, 900, 300, 700)}`);
    console.log(`FLIGHT/DATE ZONE:      ${getRegion(250, 500, 400, 1000)}`);
    console.log(`CHARGEABLE WEIGHT ROW: ${getRegion(150, 450, 0, 1000)}`);
}

const files = ['./awb_samples/126-96273133.pdf', './awb_samples/807-46065176.pdf', './awb_samples/888-10034404.pdf', './awb_samples/975-25865755.pdf'];

async function run() {
    for (const file of files) {
        await deepAudit(file);
    }
}
run();
