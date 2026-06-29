#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import path from "node:path";

const AIRPORTS_URL =
  "https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/airports.csv";
const COUNTRIES_URL =
  "https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/countries.csv";
const OUTPUT_PATH = path.join(process.cwd(), "lib/airports/ourairports-iata.json");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

function recordsFromCsv(text) {
  const rows = parseCsv(text);
  const headers = rows.shift() ?? [];
  return rows.map((row) =>
    headers.reduce((record, header, index) => {
      record[header] = row[index] ?? "";
      return record;
    }, {}),
  );
}

async function fetchCsv(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

function typeRank(type) {
  if (type === "large_airport") return 4;
  if (type === "medium_airport") return 3;
  if (type === "small_airport") return 2;
  if (type === "seaplane_base") return 1;
  return 0;
}

function airportScore(airport) {
  return [
    airport.scheduled_service === "yes" ? 100 : 0,
    typeRank(airport.type) * 10,
    airport.name.length ? 1 : 0,
  ].reduce((total, value) => total + value, 0);
}

const [airportsCsv, countriesCsv] = await Promise.all([
  fetchCsv(AIRPORTS_URL),
  fetchCsv(COUNTRIES_URL),
]);
const countries = new Map(
  recordsFromCsv(countriesCsv).map((country) => [country.code, country.name]),
);
const byIata = new Map();

for (const airport of recordsFromCsv(airportsCsv)) {
  const iata = airport.iata_code?.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(iata)) continue;

  const reference = {
    airportName: airport.name?.trim() || iata,
    city: airport.municipality?.trim() || "",
    country: countries.get(airport.iso_country) || airport.iso_country || "",
    iata,
  };
  const existing = byIata.get(iata);
  if (!existing || airportScore(airport) > existing.score) {
    byIata.set(iata, { reference, score: airportScore(airport) });
  }
}

const generated = Array.from(byIata.values())
  .map((entry) => entry.reference)
  .sort((left, right) => left.iata.localeCompare(right.iata));

const file = `${JSON.stringify(generated, null, 2)}\n`;
await writeFile(OUTPUT_PATH, file);
console.log(`Wrote ${generated.length} IATA airport references to ${OUTPUT_PATH}`);
