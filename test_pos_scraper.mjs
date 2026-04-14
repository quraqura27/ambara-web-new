import * as fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { scrapeCoordinateAWB } from './awb-pos-scraper.js';

async function testFile(filePath) {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const loadingTask = pdfjsLib.getDocument({data});
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    
    // Pass raw items with X/Y to the positional scraper
    const res = scrapeCoordinateAWB(textContent.items);
    
    console.log(`\n===== COORDINATE RESULTS FOR ${filePath} =====`);
    console.log(`AWB:      ${res.awbNumber}`);
    console.log(`Airline:  ${res.airline}`);
    console.log(`Flight:   ${res.flightNumber} on ${res.flightDate}`);
    console.log(`Route:    ${res.origin} -> ${res.destination}`);
    console.log(`Stats:    ${res.pieces} pcs | ${res.weight} kg (Chargeable)`);
}

const files = [
    './awb_samples/126-96273133.pdf',
    './awb_samples/807-46065176.pdf',
    './awb_samples/888-10034404.pdf',
    './awb_samples/975-25865755.pdf'
];

async function run() {
    for (const file of files) {
        try {
            await testFile(file);
        } catch (e) {
            console.error(`Failed ${file}: ${e.message}`);
        }
    }
}
run();
