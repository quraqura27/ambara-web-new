import * as fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function mapHeaders(filePath) {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const loadingTask = pdfjsLib.getDocument({data});
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    const items = textContent.items;

    console.log(`\n--- HEADER MAP: ${filePath} ---`);
    const keywords = ["Pieces", "Gross", "Chargeable", "Flight", "Date", "Carriage"];
    items.forEach(i => {
        keywords.forEach(kw => {
            if (i.str.toLowerCase().includes(kw.toLowerCase())) {
                console.log(`FOUND [${i.str}] at X: ${Math.round(i.transform[4])}, Y: ${Math.round(i.transform[5])}`);
            }
        });
    });
}

const files = ['./awb_samples/126-96273133.pdf', './awb_samples/807-46065176.pdf', './awb_samples/888-10034404.pdf', './awb_samples/975-25865755.pdf'];

async function run() {
    for (const file of files) {
        await mapHeaders(file);
    }
}
run();
