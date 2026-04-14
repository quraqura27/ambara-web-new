import * as fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function extractText(filePath) {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const loadingTask = pdfjsLib.getDocument({data});
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    const text = textContent.items.map(item => item.str).join(' ');
    console.log(`--- TEXT FROM ${filePath} ---`);
    console.log(text);
    console.log('\n');
}

const files = [
    './awb_samples/126-96273133.pdf',
    './awb_samples/807-22216073.pdf',
    './awb_samples/888-10034404.pdf',
    './awb_samples/975-25865755.pdf'
];

async function run() {
    for (const file of files) {
        try {
            await extractText(file);
        } catch (e) {
            console.error(`Failed ${file}: ${e.message}`);
        }
    }
}

run();
