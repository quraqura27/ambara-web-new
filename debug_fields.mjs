import * as fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function extractFields(filePath) {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const loadingTask = pdfjsLib.getDocument({data});
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    const items = textContent.items;

    // PHYSICAL REGION ENGINE
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

    // We use standard AWB coordinates (scaled 0-1000ish)
    // Most AWB labels live at Y: 700-850 (Shipper) and Y: 550-700 (Consignee)
    return {
        awb: getRegion(800, 950, 400, 1000), // Top Right area
        shipper: getRegion(700, 850, 0, 450),
        consignee: getRegion(550, 700, 0, 450),
        route: getRegion(500, 600, 450, 1000),
        cargo: getRegion(200, 400, 0, 1000)
    };
}

const files = ['./awb_samples/126-96273133.pdf', './awb_samples/807-46065176.pdf', './awb_samples/888-10034404.pdf', './awb_samples/975-25865755.pdf'];

async function run() {
    for (const file of files) {
        const res = await extractFields(file);
        console.log(`\n========================================`);
        console.log(`FILE: ${file}`);
        console.log(`AWB REGION:       ${res.awb}`);
        console.log(`SHIPPER BOX:      ${res.shipper}`);
        console.log(`CONSIGNEE BOX:    ${res.consignee}`);
        console.log(`ROUTE REGION:     ${res.route}`);
        console.log(`CARGO REGION:     ${res.cargo}`);
    }
}
run();
