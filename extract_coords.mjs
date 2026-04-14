import * as fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function extractPositionalText(filePath) {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const loadingTask = pdfjsLib.getDocument({data});
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    
    console.log(`--- POSITIONAL DATA FROM ${filePath} ---`);
    const sorted = textContent.items.sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4]);
    
    sorted.forEach(item => {
        const x = Math.round(item.transform[4]);
        const y = Math.round(item.transform[5]);
        if (item.str.trim()) {
            console.log(`[X:${x.toString().padStart(3)}, Y:${y.toString().padStart(3)}] "${item.str}"`);
        }
    });
    console.log('\n');
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
            await extractPositionalText(file);
        } catch (e) {
            console.error(`Failed ${file}: ${e.message}`);
        }
    }
}

run();
