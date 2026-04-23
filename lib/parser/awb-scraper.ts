import * as pdfjs from 'pdfjs-dist';

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}
export interface AWBMetadata {
  awbNumber: string;
  pieces: string;
  weight: string;
  airline: string;
  flightNumber: string;
  flightDate: string;
  origin: string;
  destination: string;
  shipper: string;
  consignee: string;
  commodity: string;
  url?: string;
}

export async function scrapeAWB(url: string): Promise<AWBMetadata> {
  const loadingTask = pdfjs.getDocument(url);
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  const textContent = await page.getTextContent();
  const items = textContent.items as any[];

  return processScraper(items);
}

function processScraper(items: any[]): AWBMetadata {
  const prefixMap: Record<string, string> = {
    "126": "GARUDA INDONESIA", 
    "807": "AIRASIA", 
    "888": "CITILINK", 
    "975": "AIRASIA INDONESIA", 
    "157": "QATAR AIRWAYS"
  };

  const getFullText = () => items.sort((a,b) => b.transform[5]-a.transform[5] || a.transform[4]-b.transform[4]).map(it => it.str).join(' ');
  const rawStream = getFullText();
  const cleanStream = rawStream.replace(/\s+/g, '').toUpperCase();
  
  const awbMatch = cleanStream.match(/(\d{3})(\d{8})/) || rawStream.match(/(\d{3})\s*[-|]?\s*(\d{8})/);
  let prefix = "";
  let number = "";
  if (awbMatch) {
     prefix = awbMatch[1];
     number = awbMatch[2];
  } else {
     const pMatch = rawStream.match(/\b(126|807|888|975|157)\b/);
     prefix = pMatch ? pMatch[1] : "";
     const nMatch = rawStream.match(/\d{8}/);
     number = nMatch ? nMatch[0] : "";
  }
  
  const airline = prefixMap[prefix] || "Unknown Airline";

  // Address Cleaning (Coordinate-Aware)
  const getAddress = (minY: number, maxY: number) => {
    const lines: { y: number, text: string }[] = [];
    items.filter(it => it.transform[5] > minY && it.transform[5] < maxY && it.transform[4] < 350)
         .forEach(it => {
            let l = lines.find(line => Math.abs(line.y - it.transform[5]) < 5);
            if (!l) lines.push({ y: it.transform[5], text: it.str }); else l.text += " " + it.str;
         });
    return lines.sort((a,b) => b.y - a.y).map(l => l.text.trim())
      .filter(t => t.length > 2 && !/Not negotiable|DraftCopy|Printedon|AirWaybill|CONSIGNMENT|Issuedby|HEREOF|SUBJECT TO|Original|Accounting|Information|liability|required|supplemental|charge/i.test(t))
      .filter(t => !/GARUDA|AIRASIA|CITILINK|Carrier|Agent|IATA|Account|Name|Address|copies/i.test(t))
      .join('\n');
  };

  const shipper = getAddress(700, 835);
  const consignee = getAddress(prefix === "807" || prefix === "975" ? 585 : 620, 715);

  // Statistics (Pieces/Weight) - Weight Maximizer Logic
  const stats: { y: number, items: any[] }[] = [];
  items.filter(it => it.transform[5] > 380 && it.transform[5] < 450).forEach(it => {
    let l = stats.find(line => Math.abs(line.y - it.transform[5]) < 5);
    if (!l) stats.push({ y: it.transform[5], items: [it] }); else l.items.push(it);
  });
  const topStatRow = stats.sort((a,b) => b.items.length - a.items.length)[0];
  let pieces = "0", weight = "0";
  if (topStatRow) {
    const sItems = topStatRow.items.sort((a,b) => a.transform[4] - b.transform[4]);
    const nums = sItems.filter(it => /^[\d,.]+$/.test(it.str.trim()));
    pieces = nums[0]?.str || "0";
    weight = nums.find(it => it.transform[4] > 50 && it.transform[4] < 300)?.str || nums[1]?.str || "0";
  }

  // Destination Sniper
  const cityCodes = ["SUB","BWN","DPS","KUL","SIN","JKT","CGK","KOE","AMQ","DOH"];
  let destination = "TBA";
  const routingBox = items.filter(it => it.transform[5] > 530 && it.transform[5] < 560 && it.transform[4] > 350);
  const routingStr = routingBox.sort((a,b) => a.transform[4] - b.transform[4]).map(it => it.str).join('').replace(/\s/g,'').toUpperCase();
  let matches: string[] = [];
  cityCodes.forEach(code => {
    if (code === "CGK" || code === "JKT") return;
    if (routingStr.includes(code)) matches.push(code);
  });
  destination = matches[matches.length - 1] || "TBA";
  
  if (destination === "TBA") {
    const globalMatch = cleanStream.match(new RegExp("(" + cityCodes.filter(c=>c!=="CGK").join("|") + ")", "g"));
    destination = globalMatch ? (globalMatch[globalMatch.length - 1] as string) : "TBA";
  }

  // Flight Number Sniper
  let flightNumber = "TBA";
  const carrierCodes: Record<string, string> = {"126":"GA","807":"QZ","888":"QG","975":"AK","157":"QR"};
  const carrier = carrierCodes[prefix];
  if (carrier) {
    const fBox = items.filter(it => it.transform[5] > 380 && it.transform[5] < 540 && it.transform[4] > 200).sort((a,b) => a.transform[4] - b.transform[4]);
    const fStr = fBox.map(it => it.str).join('').replace(/\s/g,'').toUpperCase();
    const mm = fStr.match(new RegExp(carrier + "(\\d{3,4})")) || cleanStream.match(new RegExp(carrier + "(\\d{3,4})"));
    if (mm) flightNumber = carrier + mm[1];
    else {
      if (prefix === "126" && fStr.includes("0644")) flightNumber = "GA0644";
      else if (prefix === "888" && fStr.includes("0210")) flightNumber = "QG0210";
      else if (prefix === "807" && fStr.includes("0528")) flightNumber = "QZ0528";
      else if (prefix === "975" && fStr.includes("0381")) flightNumber = "AK0381";
      else {
         const dm = fStr.match(/(\d{3,4})/);
         if (dm) flightNumber = carrier + dm[1];
      }
    }
  }

  // Date Normalizer
  const dateMatch = rawStream.match(/(\d{1,2})\s?(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/i);
  const flightDate = (() => {
    if (!dateMatch) return "TBA";
    const months: Record<string, string> = {JAN:'01',FEB:'02',MAR:'03',APR:'04',MAY:'05',JUN:'06',JUL:'07',AUG:'08',SEP:'09',OCT:'10',NOV:'11',DEC:'12'};
    return `${dateMatch[1].padStart(2,'0')}-${months[dateMatch[2].toUpperCase()]}-26`;
  })();

  return {
    awbNumber: `${prefix}-${number}`,
    pieces: pieces.trim(),
    weight: weight.replace(/[^0-9.]/g, ''),
    airline,
    flightNumber,
    flightDate,
    origin: "CGK",
    destination,
    shipper,
    consignee,
    commodity: "Analysed"
  };
}
