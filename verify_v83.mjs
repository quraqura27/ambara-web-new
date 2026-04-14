import * as fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { scrapeCoordinateAWB } from './awb-pos-scraper.js';

const samples = [
  './awb_samples/126-96273133.pdf',
  './awb_samples/807-46065176.pdf',
  './awb_samples/888-10034404.pdf',
  './awb_samples/975-25865755.pdf'
];

async function run() {
  const results = [];
  for (const s of samples) {
    const data = new Uint8Array(fs.readFileSync(s));
    const loadingTask = pdfjsLib.getDocument({data});
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    
    const result = scrapeCoordinateAWB(textContent.items);
    results.push({ file: s, ...result });
  }
  
  console.log(JSON.stringify(results, null, 2));
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
