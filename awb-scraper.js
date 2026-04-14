export function scrapeAWBText(rawText) {
  // 1. AGGRESSIVE STITCHING
  const normalized = rawText
    .replace(/([A-Z0-9&',./|-])\s([A-Z0-9&',./|-])\s(?=[A-Z0-9&',./|-])/gi, '$1$2')
    .replace(/([A-Z0-9&',./|-])\s(?=[A-Z0-9&',./|-])/gi, '$1')
    .replace(/\s{2,}/g, '  ')
    .trim();

  const flex = (str) => str.split('').map(c => `${c === ' ' ? '\\s+' : c}\\s*`).join('');

  // 2. EXTRACTION LOGIC
  const awbMatch = normalized.match(/(\d{3})\s*[-|]?\s*(\d{8})/) || normalized.match(/(\d{11})/);
  let awbNumber = "000-00000000";
  if (awbMatch) {
    const prefix = awbMatch[0].length === 11 ? awbMatch[0].substring(0,3) : awbMatch[1];
    const serial = awbMatch[0].length === 11 ? awbMatch[0].substring(3) : awbMatch[2];
    awbNumber = `${prefix}-${serial}`;
  }

  const shipperAnchor = new RegExp(`${flex("Shipper's Name and Address")}(.*?)(?:${flex("Consignee")}|${flex("Account Number")}|$)`, 'i');
  const shipperMatch = normalized.match(shipperAnchor);
  let shipper = shipperMatch ? shipperMatch[1].replace(/\s{2,}/g, ' ').replace(/ID:/i, '').trim() : "Unknown Shipper";

  const consigneeAnchor = new RegExp(`${flex("Consignee's Name and Address")}(.*?)(?:${flex("By first Carrier")}|${flex("Account Number")}|${flex("Airport of Departure")}|$)`, 'i');
  const consigneeMatch = normalized.match(consigneeAnchor);
  let consignee = consigneeMatch ? consigneeMatch[1].replace(/\s{2,}/g, ' ').replace(/AccountNumber/i, '').trim() : "Unknown Consignee";

  const routeMatch = normalized.match(/([A-Z]{3})\s*[-|/]\s*([A-Z]{3})/) 
    || normalized.match(new RegExp(`${flex("Airport of Departure")}.*?([A-Z]{3}).*?${flex("Airport of Destination")}.*?([A-Z]{3})`, 'i'));
  const origin = routeMatch ? routeMatch[1] : "CGK";
  const destination = routeMatch ? routeMatch[2] : "";

  const flightMatch = normalized.match(new RegExp(`${flex("Flight/Date")}\\s*([A-Z0-9]{2,}\\s*\\d{3,})`, 'i')) 
    || normalized.match(/([A-Z0-9]{2,}-?\d{3,})\s*\//)
    || normalized.match(/([A-Z]{2}\s?\d{3,})/i);
  const flightNumber = flightMatch ? flightMatch[1].trim() : "TBA";

  const piecesMatch = normalized.match(new RegExp(`${flex("No. of Pieces")}\\s*(\\d+)`, 'i')) 
    || normalized.match(/(\d+)\s+(?:\d{4}|[A-Z])\s+\d+\.\d{2}/)
    || normalized.match(/RCP\s*(\d+)/i);
  const pieces = piecesMatch ? parseInt(piecesMatch[1]) : 0;

  const weightMatch = normalized.match(new RegExp(`${flex("Gross Weight")}\\s*(\\d+\\.\\d{1,2})`, 'i')) 
    || normalized.match(/(\d+\.\d{1,2})\s*K/i);
  const grossWeight = weightMatch ? parseFloat(weightMatch[1]) : 0;

  const commodityMatch = normalized.match(new RegExp(`${flex("Nature and Quantity of Goods")}\\s*(.*?)(?:DIMS|Total|$)`, 'i'))
    || normalized.match(/Nature\s*and\s*Quantity\s*of\s*Goods.*?\s([A-Z\s]+)(?:$)/i);
  const commodity = commodityMatch ? commodityMatch[1].trim() : "General Cargo";

  return { awbNumber, shipper, consignee, origin, destination, flightNumber, pieces, grossWeight, commodity };
}
