import * as fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { scrapeAWBText } from './awb-scraper.js';

async function testFile(filePath) {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const loadingTask = pdfjsLib.getDocument({data});
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    const rawText = textContent.items.map(item => item.str).join(' ');
    
    // Use the final literal regex scraper
    const result = scrapeAWBText(rawText);
    
    console.log(`\n===== RESULTS FOR ${filePath} =====`);
    console.log(`AWB:      ${result.awbNumber}`);
    console.log(`Shipper:  ${result.shipper.substring(0, 80)}...`);
    console.log(`Consignee:${result.consignee.substring(0, 80)}...`);
    console.log(`Route:    ${result.origin} -> ${result.destination}`);
    console.log(`Flight:   ${result.flightNumber}`);
    console.log(`Stats:    ${result.pieces} pcs | ${result.grossWeight} kg`);
    console.log(`Cargo:    ${result.commodity}`);
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
