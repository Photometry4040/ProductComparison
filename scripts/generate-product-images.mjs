/**
 * Generates one SVG product tile per seed product into /public/products/.
 *
 * These are committed, repo-hosted assets referenced by path (e.g.
 * "/products/benq-tk710.svg") — no external hotlinking. To use a real photo,
 * drop a file with the SAME slug name (any web format) into public/products/
 * and point the product's imageUrl at it, or just overwrite the .svg.
 *
 * Run:  node scripts/generate-product-images.mjs
 *
 * The product list + slug rule below MUST match data/mockData.ts.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'products');

// Keep in sync with data/mockData.ts (slugify).
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const CATEGORY = {
  HT: { name: 'Home Theater Projector', color: '#4f46e5', icon: 'projector' },
  BIZ: { name: 'Business / Education Projector', color: '#0891b2', icon: 'projector' },
  MON: { name: 'Professional Monitor', color: '#16a34a', icon: 'monitor' },
  INT: { name: 'Interactive Display', color: '#d97706', icon: 'interactive' },
  LED: { name: 'LED Video Wall', color: '#db2777', icon: 'wall' },
};

const PRODUCTS = [
  ['BenQ', 'TK710', 'HT'], ['BenQ', 'HT4550i', 'HT'], ['Epson', 'Pro Cinema LS12000', 'HT'],
  ['Sony', 'VPL-XW5000ES', 'HT'], ['JVC', 'DLA-NZ500', 'HT'], ['Epson', 'Home Cinema 2350', 'HT'],
  ['XGIMI', 'Horizon Ultra', 'HT'],
  ['Epson', 'PowerLite L630U', 'BIZ'], ['BenQ', 'LU935', 'BIZ'], ['Panasonic', 'PT-VMZ71', 'BIZ'],
  ['Optoma', 'ZU607T', 'BIZ'], ['NEC', 'PV800UL', 'BIZ'], ['Christie', 'DWU760-iS', 'BIZ'],
  ['Apple', 'Pro Display XDR', 'MON'], ['Dell', 'UltraSharp U3223QE', 'MON'], ['LG', 'UltraFine 32EP950', 'MON'],
  ['ASUS', 'ProArt PA32UCG', 'MON'], ['EIZO', 'ColorEdge CG2700X', 'MON'], ['Samsung', 'ViewFinity S9', 'MON'],
  ['BenQ', 'PD3220U', 'MON'],
  ['Samsung', 'Flip Pro WMB', 'INT'], ['Microsoft', 'Surface Hub 3 50"', 'INT'], ['ViewSonic', 'ViewBoard IFP7550', 'INT'],
  ['Promethean', 'ActivPanel 9', 'INT'], ['SMART', 'Board GX075', 'INT'], ['LG', 'CreateBoard 86TR3DK', 'INT'],
  ['Samsung', 'The Wall IWA (146")', 'LED'], ['LG', 'MAGNIT LSAB (136")', 'LED'],
  ['Absen', 'Acclaim Plus (130")', 'LED'], ['Planar', 'TVF Series (120")', 'LED'],
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const icon = (type) => {
  switch (type) {
    case 'projector':
      return `<rect x="140" y="92" width="120" height="56" rx="12"/>
              <circle cx="172" cy="120" r="20" fill="none" stroke="#fff" stroke-width="6"/>
              <rect x="228" y="104" width="22" height="8" rx="4"/>
              <rect x="150" y="148" width="14" height="10"/><rect x="236" y="148" width="14" height="10"/>`;
    case 'monitor':
      return `<rect x="138" y="76" width="124" height="80" rx="8"/>
              <rect x="186" y="156" width="28" height="16"/>
              <rect x="166" y="170" width="68" height="9" rx="4"/>`;
    case 'interactive':
      return `<rect x="128" y="72" width="144" height="96" rx="8"/>
              <circle cx="236" cy="152" r="9" fill="${'#fff'}"/>
              <path d="M236 152 l16 26 l-9 2 l-3 9 z"/>`;
    case 'wall': {
      let r = '';
      for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++)
        r += `<rect x="${146 + col * 38}" y="${92 + row * 38}" width="32" height="32" rx="3"/>`;
      return r;
    }
    default:
      return '';
  }
};

const svgFor = (brand, model, cat) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <rect width="400" height="300" fill="${cat.color}"/>
  <rect width="400" height="300" fill="#000" opacity="0.06"/>
  <g fill="#fff" opacity="0.22">${icon(cat.icon)}</g>
  <text x="200" y="208" text-anchor="middle" font-family="-apple-system, Segoe UI, Roboto, sans-serif" font-size="30" font-weight="700" fill="#fff">${esc(brand)}</text>
  <text x="200" y="240" text-anchor="middle" font-family="-apple-system, Segoe UI, Roboto, sans-serif" font-size="20" fill="#fff" opacity="0.95">${esc(model)}</text>
  <text x="200" y="276" text-anchor="middle" font-family="-apple-system, Segoe UI, Roboto, sans-serif" font-size="12" letter-spacing="1.5" fill="#fff" opacity="0.7">${esc(cat.name.toUpperCase())}</text>
</svg>
`;

mkdirSync(OUT_DIR, { recursive: true });
const seen = new Set();
for (const [brand, model, catKey] of PRODUCTS) {
  const cat = CATEGORY[catKey];
  const slug = slugify(`${brand} ${model}`);
  if (seen.has(slug)) throw new Error(`Duplicate slug: ${slug}`);
  seen.add(slug);
  writeFileSync(join(OUT_DIR, `${slug}.svg`), svgFor(brand, model, cat));
}
console.log(`Generated ${seen.size} product images into ${OUT_DIR}`);
