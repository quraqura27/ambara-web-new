const fs = require('fs');
const { createCanvas } = require('canvas');
const topojson = require('topojson-client');
const d3Geo = require('d3-geo');

const topology = JSON.parse(fs.readFileSync('public/earth-topology.json', 'utf8'));
const geojson = topojson.feature(topology, topology.objects.countries);

const width = 2048;
const height = 1024;
const canvas = createCanvas(width, height);
const context = canvas.getContext('2d');

const projection = d3Geo.geoEquirectangular()
  .scale(width / (2 * Math.PI))
  .translate([width / 2, height / 2]);

const path = d3Geo.geoPath().projection(projection).context(context);

context.fillStyle = '#000000';
context.fillRect(0, 0, width, height);

context.fillStyle = '#ffffff';
context.beginPath();
path(geojson);
context.fill();

const out = fs.createWriteStream('public/earth-mask.png');
const stream = canvas.createPNGStream();
stream.pipe(out);
out.on('finish', () =>  console.log('earth-mask.png created.'));
