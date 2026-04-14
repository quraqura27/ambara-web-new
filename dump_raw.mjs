import * as fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function dumpRaw(filePath) {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const loadingTask = pdfjsLib.getDocument({data});
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    const rawText = textContent.items.map(item => item.str).join(' ');
    
    console.log(`\n--- RAW DUMP: ${filePath} ---`);
    console.log(rawText.substring(0, 2000)); // Show first 2000 chars
}

const files = [
    './awb_samples/126-96273133.pdf',
    './awb_samples/807-46065176.pdf',
    './awb_samples/888-10034404.pdf',
    './awb_samples/975-25865755.pdf'
];

async function run() {
    for (const file of files) {
        await dumpRaw(file);
    }
}
run();
