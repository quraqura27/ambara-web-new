import * as fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function diagnose(path) {
    const data = new Uint8Array(fs.readFileSync(path));
    const loadingTask = pdfjsLib.getDocument({data, verbosity: 0});
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    
    console.log(`\n--- ${path} ---`);
    const sorted = textContent.items.sort((a,b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4]);
    
    // Group into rows
    const rows = [];
    sorted.forEach(it => {
        let r = rows.find(row => Math.abs(row.y - it.transform[5]) < 5);
        if (!r) {
            rows.push({y: it.transform[5], text: it.str, items: [it]});
        } else {
            r.text += (it.transform[4] - (r.items[r.items.length-1].transform[4] + (r.items[r.items.length-1].width || 0)) > 5 ? ' ' : '') + it.str;
            r.items.push(it);
        }
    });

    rows.forEach(r => {
        // Only print rows that likely contain our targets
        if (r.text.includes('126') || r.text.includes('807') || r.text.includes('888') || r.text.includes('975') || 
            r.text.length > 5 && (r.y > 700 || (r.y > 380 && r.y < 580))) {
            console.log(`Y: ${Math.round(r.y)} | Text: ${r.text}`);
        }
    });
}

const files = [
    './awb_samples/126-96273133.pdf',
    './awb_samples/807-46065176.pdf',
    './awb_samples/888-10034404.pdf',
    './awb_samples/975-25865755.pdf'
];

for (const f of files) {
    if (fs.existsSync(f)) {
        await diagnose(f);
    } else {
        console.log(`File not found: ${f}`);
    }
}
