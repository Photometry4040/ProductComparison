import { Product, Spec } from '../types';

/**
 * Seed dataset for the AV / display domain.
 *
 * Spec IDs are stable, human-readable strings (not UUIDs) so the product
 * records below stay legible. User-created specs still get UUIDs at runtime.
 * Every spec carries comparison metadata (kind / unit / betterDirection /
 * weight / category) which powers winner-highlight, charts and the decision
 * matrix. Numeric values keep their unit in the display string; the shared
 * parser in utils/specValue.ts extracts the leading number for comparison.
 */

// --- Spec IDs -------------------------------------------------------------
const S = {
  price: 'price',
  msrp: 'msrp',
  status: 'status',
  released: 'released',
  warranty: 'warranty',
  brightness: 'brightness',
  resolution: 'resolution',
  contrast: 'contrast',
  hdr: 'hdr',
  refresh: 'refresh',
  responseTime: 'responseTime',
  inputLag: 'inputLag',
  screenSize: 'screenSize',
  panelTech: 'panelTech',
  pixelPitch: 'pixelPitch',
  speakers: 'speakers',
  connectivity: 'connectivity',
  touchPoints: 'touchPoints',
  powerConsumption: 'powerConsumption',
  weight: 'weight',
  lightSource: 'lightSource',
} as const;

export const SEED_SPECS: Spec[] = [
  { id: S.price, name: 'Street Price (USD)', kind: 'currency', unit: 'USD', betterDirection: 'lower', weight: 80, category: 'Price' },
  { id: S.msrp, name: 'MSRP (USD)', kind: 'currency', unit: 'USD', betterDirection: 'lower', weight: 10, category: 'Price' },
  { id: S.status, name: 'Status', kind: 'text', betterDirection: 'none', category: 'General' },
  { id: S.released, name: 'Released (Year)', kind: 'number', betterDirection: 'higher', weight: 10, category: 'General' },
  { id: S.warranty, name: 'Warranty (Years)', kind: 'number', unit: 'Years', betterDirection: 'higher', weight: 20, category: 'General' },
  { id: S.brightness, name: 'Brightness', kind: 'number', betterDirection: 'higher', weight: 70, category: 'Image' },
  { id: S.resolution, name: 'Native Resolution', kind: 'text', betterDirection: 'none', category: 'Image' },
  { id: S.contrast, name: 'Contrast Ratio', kind: 'number', betterDirection: 'higher', weight: 50, category: 'Image' },
  { id: S.hdr, name: 'HDR Support', kind: 'enum', betterDirection: 'none', category: 'Image' },
  { id: S.refresh, name: 'Refresh Rate (Hz)', kind: 'number', unit: 'Hz', betterDirection: 'higher', weight: 40, category: 'Performance' },
  { id: S.responseTime, name: 'Response Time (ms)', kind: 'number', unit: 'ms', betterDirection: 'lower', weight: 30, category: 'Performance' },
  { id: S.inputLag, name: 'Input Lag (ms)', kind: 'number', unit: 'ms', betterDirection: 'lower', weight: 30, category: 'Performance' },
  { id: S.screenSize, name: 'Screen Size (inch)', kind: 'number', unit: 'inch', betterDirection: 'higher', weight: 30, category: 'Display' },
  { id: S.panelTech, name: 'Display Technology', kind: 'enum', betterDirection: 'none', category: 'Display' },
  { id: S.pixelPitch, name: 'Pixel Pitch (mm)', kind: 'number', unit: 'mm', betterDirection: 'lower', weight: 30, category: 'Display' },
  { id: S.speakers, name: 'Built-in Speakers (W)', kind: 'number', unit: 'W', betterDirection: 'higher', weight: 10, category: 'Audio' },
  { id: S.connectivity, name: 'Connectivity', kind: 'text', betterDirection: 'none', category: 'Connectivity' },
  { id: S.touchPoints, name: 'Touch Points', kind: 'number', betterDirection: 'higher', weight: 20, category: 'Interactive' },
  { id: S.powerConsumption, name: 'Power Consumption (W)', kind: 'number', unit: 'W', betterDirection: 'lower', weight: 15, category: 'Power' },
  { id: S.weight, name: 'Weight (kg)', kind: 'number', unit: 'kg', betterDirection: 'lower', weight: 10, category: 'Physical' },
  { id: S.lightSource, name: 'Light Source Life (hrs)', kind: 'number', unit: 'hrs', betterDirection: 'higher', weight: 20, category: 'General' },
];

export const CATEGORIES = [
  'Home Theater Projector',
  'Business / Education Projector',
  'Professional Monitor',
  'Interactive Display',
  'LED Video Wall',
] as const;

type SeedProduct = Omit<Product, 'id' | 'imageUrl'> & { imageUrl?: string };

/**
 * Slug for a product's image file. Must match scripts/generate-product-images.mjs.
 * Images are repo-hosted assets under /public/products and referenced by path
 * (e.g. "/products/benq-tk710.svg") — no external hotlinking.
 *
 * To use a real product photo: drop a file with the same slug name into
 * public/products/ and set `imageUrl` on the product (overrides the default
 * via the spread below), or simply overwrite the generated .svg.
 */
const slugify = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const productImage = (brand: string, model: string): string =>
  `/products/${slugify(`${brand} ${model}`)}.svg`;

let seedCounter = 0;
const make = (p: SeedProduct): Product => {
  seedCounter++;
  return {
    id: `seed-${seedCounter}`,
    imageUrl: productImage(p.brand, p.model),
    ...p,
  };
};

export const SEED_PRODUCTS: Product[] = [
  // --- Home Theater Projectors -----------------------------------------
  make({ brand: 'BenQ', model: 'TK710', category: 'Home Theater Projector', imageUrl: '/products/benq-tk710.jpg', specs: {
    [S.price]: '$1,899', [S.msrp]: '$3,499', [S.status]: 'Shipping', [S.released]: '2024', [S.warranty]: '3 Years',
    [S.brightness]: '3,200 lumens', [S.resolution]: '3840x2160', [S.contrast]: '600,000:1', [S.hdr]: 'HDR10 / HLG',
    [S.panelTech]: 'DLP', [S.speakers]: '5 W', [S.connectivity]: 'HDMI 2.1 x2, USB', [S.powerConsumption]: '275 W',
    [S.weight]: '3.0 kg', [S.lightSource]: '20,000 hrs' } }),
  make({ brand: 'BenQ', model: 'HT4550i', category: 'Home Theater Projector', imageUrl: '/products/benq-ht4550i.jpg', specs: {
    [S.price]: '$2,999', [S.msrp]: '$2,999', [S.status]: 'Shipping', [S.released]: '2023', [S.warranty]: '3 Years',
    [S.brightness]: '3,200 lumens', [S.resolution]: '3840x2160', [S.contrast]: '2,000,000:1', [S.hdr]: 'HDR10+ / HLG',
    [S.panelTech]: 'DLP', [S.speakers]: '5 W', [S.connectivity]: 'HDMI 2.0b x2, Android TV', [S.powerConsumption]: '385 W',
    [S.weight]: '6.6 kg', [S.lightSource]: '20,000 hrs' } }),
  make({ brand: 'Epson', model: 'Pro Cinema LS12000', category: 'Home Theater Projector', imageUrl: '/products/epson-pro-cinema-ls12000.jpg', specs: {
    [S.price]: '$5,999', [S.msrp]: '$4,999', [S.status]: 'Shipping', [S.released]: '2022', [S.warranty]: '3 Years',
    [S.brightness]: '2,700 lumens', [S.resolution]: '3840x2160', [S.contrast]: '2,500,000:1', [S.hdr]: 'HDR10+ / HLG',
    [S.panelTech]: '3LCD', [S.connectivity]: 'HDMI 2.1 x2', [S.powerConsumption]: '311 W',
    [S.weight]: '12.7 kg', [S.lightSource]: '20,000 hrs' } }),
  make({ brand: 'Sony', model: 'VPL-XW5000ES', category: 'Home Theater Projector', imageUrl: '/products/sony-vpl-xw5000es.jpg', specs: {
    [S.price]: '$5,998', [S.msrp]: '$5,999', [S.status]: 'Shipping', [S.released]: '2022', [S.warranty]: '3 Years',
    [S.brightness]: '2,000 lumens', [S.resolution]: '3840x2160', [S.contrast]: 'Infinite', [S.hdr]: 'HDR10 / HLG',
    [S.panelTech]: 'SXRD', [S.connectivity]: 'HDMI 2.1 x2', [S.powerConsumption]: '295 W',
    [S.weight]: '12.7 kg', [S.lightSource]: '20,000 hrs' } }),
  make({ brand: 'JVC', model: 'DLA-NZ500', category: 'Home Theater Projector', imageUrl: '/products/jvc-dla-nz500.jpg', specs: {
    [S.price]: '$5,999', [S.msrp]: '$5,999', [S.status]: 'Shipping', [S.released]: '2025', [S.warranty]: '3 Years',
    [S.brightness]: '2,000 lumens', [S.resolution]: '4096x2160', [S.contrast]: '40,000:1', [S.hdr]: 'HDR10+ / HLG',
    [S.panelTech]: 'D-ILA', [S.connectivity]: 'HDMI 2.1 x2', [S.powerConsumption]: '280 W',
    [S.weight]: '14.6 kg', [S.lightSource]: '20,000 hrs' } }),
  make({ brand: 'Epson', model: 'Home Cinema 2350', category: 'Home Theater Projector', imageUrl: '/products/epson-home-cinema-2350.jpg', specs: {
    [S.price]: '$1,399', [S.msrp]: '$1,099', [S.status]: 'Shipping', [S.released]: '2022', [S.warranty]: '2 Years',
    [S.brightness]: '2,800 lumens', [S.resolution]: '1920x1080', [S.contrast]: '35,000:1', [S.hdr]: 'HDR10',
    [S.panelTech]: '3LCD', [S.speakers]: '10 W', [S.connectivity]: 'HDMI x2, Android TV', [S.powerConsumption]: '316 W',
    [S.weight]: '4.1 kg', [S.lightSource]: '4,500 hrs' } }),
  make({ brand: 'XGIMI', model: 'Horizon Ultra', category: 'Home Theater Projector', imageUrl: '/products/xgimi-horizon-ultra.jpg', specs: {
    [S.price]: '$1,699', [S.msrp]: '$1,999', [S.status]: 'Shipping', [S.released]: '2023', [S.warranty]: '1 Year',
    [S.brightness]: '2,300 lumens', [S.resolution]: '3840x2160', [S.contrast]: '5,000:1', [S.hdr]: 'Dolby Vision / HDR10',
    [S.panelTech]: 'DLP', [S.speakers]: '12 W × 2', [S.connectivity]: 'HDMI 2.1, Android TV', [S.powerConsumption]: '300 W',
    [S.weight]: '5.2 kg', [S.lightSource]: '25,000 hrs' } }),

  // --- Business / Education Projectors ---------------------------------
  make({ brand: 'Epson', model: 'PowerLite L630U', category: 'Business / Education Projector', imageUrl: '/products/epson-powerlite-l630u.jpg', specs: {
    [S.price]: '$3,496', [S.msrp]: '$3,496', [S.status]: 'Shipping', [S.released]: '2021', [S.warranty]: '3 Years',
    [S.brightness]: '6,200 lumens', [S.resolution]: '1920x1200', [S.contrast]: '2,500,000:1',
    [S.panelTech]: '3LCD', [S.speakers]: '10 W', [S.connectivity]: 'HDBaseT, HDMI x2, LAN', [S.powerConsumption]: '358 W',
    [S.weight]: '8.4 kg', [S.lightSource]: '20,000 hrs' } }),
  make({ brand: 'BenQ', model: 'LU935', category: 'Business / Education Projector', imageUrl: '/products/benq-lu935.jpg', specs: {
    [S.price]: '$3,699', [S.msrp]: '$3,599', [S.status]: 'Shipping', [S.released]: '2023', [S.warranty]: '3 Years',
    [S.brightness]: '6,000 lumens', [S.resolution]: '1920x1200', [S.contrast]: '3,000,000:1',
    [S.panelTech]: 'DLP', [S.speakers]: '10 W × 2', [S.connectivity]: 'HDMI x2, LAN, USB', [S.powerConsumption]: '440 W',
    [S.weight]: '7.0 kg', [S.lightSource]: '20,000 hrs' } }),
  make({ brand: 'Panasonic', model: 'PT-VMZ71', category: 'Business / Education Projector', imageUrl: '/products/panasonic-pt-vmz71.jpg', specs: {
    [S.price]: '$4,185', [S.msrp]: '$4,185', [S.status]: 'Shipping', [S.released]: '2022', [S.warranty]: '3 Years',
    [S.brightness]: '7,000 lumens', [S.resolution]: '1920x1200', [S.contrast]: '3,000,000:1',
    [S.panelTech]: '3LCD', [S.speakers]: '10 W', [S.connectivity]: 'HDMI x2, LAN', [S.powerConsumption]: '420 W',
    [S.weight]: '7.0 kg', [S.lightSource]: '20,000 hrs' } }),
  make({ brand: 'Optoma', model: 'ZU607T', category: 'Business / Education Projector', imageUrl: '/products/optoma-zu607t.jpg', specs: {
    [S.price]: '$3,349', [S.msrp]: '$3,799', [S.status]: 'Shipping', [S.released]: '2024', [S.warranty]: '3 Years',
    [S.brightness]: '5,200 lumens', [S.resolution]: '1920x1200', [S.contrast]: '300,000:1',
    [S.panelTech]: 'DLP', [S.speakers]: '15 W × 2', [S.connectivity]: 'HDBaseT, HDMI x2', [S.powerConsumption]: '366 W',
    [S.weight]: '6.3 kg', [S.lightSource]: '30,000 hrs' } }),
  make({ brand: 'NEC', model: 'PV800UL', category: 'Business / Education Projector', specs: {
    [S.price]: '$4,500', [S.msrp]: '$4,900', [S.status]: 'Shipping', [S.released]: '2021', [S.warranty]: '3 Years',
    [S.brightness]: '8,000 ANSI Lumens', [S.resolution]: '1920x1200', [S.contrast]: '2,500,000:1',
    [S.panelTech]: 'DLP', [S.speakers]: '20 W', [S.connectivity]: 'HDBaseT, HDMI x2, LAN', [S.powerConsumption]: '545 W',
    [S.weight]: '11.4 kg', [S.lightSource]: '20,000 hrs' } }),
  make({ brand: 'Christie', model: 'DWU760-iS', category: 'Business / Education Projector', specs: {
    [S.price]: '$8,995', [S.msrp]: '$9,500', [S.status]: 'Shipping', [S.released]: '2022', [S.warranty]: '3 Years',
    [S.brightness]: '7,000 ANSI Lumens', [S.resolution]: '1920x1200', [S.contrast]: '1,450,000:1',
    [S.panelTech]: 'DLP', [S.connectivity]: 'HDBaseT, HDMI x2, SDI, LAN', [S.powerConsumption]: '720 W',
    [S.weight]: '22.5 kg', [S.lightSource]: '20,000 hrs' } }),

  // --- Professional Monitors -------------------------------------------
  make({ brand: 'Apple', model: 'Pro Display XDR', category: 'Professional Monitor', specs: {
    [S.price]: '$4,999', [S.msrp]: '$4,999', [S.status]: 'Shipping', [S.released]: '2019', [S.warranty]: '1 Year',
    [S.brightness]: '1,600 nits', [S.resolution]: '6016x3384', [S.contrast]: '1,000,000:1', [S.hdr]: 'HDR (XDR)',
    [S.refresh]: '60 Hz', [S.responseTime]: '9 ms', [S.screenSize]: '32 inch', [S.panelTech]: 'IPS (mini-LED)',
    [S.connectivity]: 'Thunderbolt 3, USB-C x3', [S.weight]: '7.5 kg', [S.powerConsumption]: '180 W' } }),
  make({ brand: 'Dell', model: 'UltraSharp U3223QE', category: 'Professional Monitor', specs: {
    [S.price]: '$999', [S.msrp]: '$1,149', [S.status]: 'Shipping', [S.released]: '2022', [S.warranty]: '3 Years',
    [S.brightness]: '400 nits', [S.resolution]: '3840x2160', [S.contrast]: '2,000:1', [S.hdr]: 'HDR400',
    [S.refresh]: '60 Hz', [S.responseTime]: '5 ms', [S.inputLag]: '10 ms', [S.screenSize]: '31.5 inch', [S.panelTech]: 'IPS Black',
    [S.connectivity]: 'USB-C 90W hub, HDMI, DP', [S.weight]: '9.0 kg', [S.powerConsumption]: '140 W' } }),
  make({ brand: 'LG', model: 'UltraFine 32EP950', category: 'Professional Monitor', specs: {
    [S.price]: '$2,999', [S.msrp]: '$3,499', [S.status]: 'Shipping', [S.released]: '2021', [S.warranty]: '2 Years',
    [S.brightness]: '540 nits', [S.resolution]: '3840x2160', [S.contrast]: '1,000,000:1', [S.hdr]: 'HDR (OLED)',
    [S.refresh]: '60 Hz', [S.responseTime]: '1 ms', [S.screenSize]: '31.5 inch', [S.panelTech]: 'OLED',
    [S.connectivity]: 'Thunderbolt 3, USB-C, DP', [S.weight]: '8.0 kg', [S.powerConsumption]: '120 W' } }),
  make({ brand: 'ASUS', model: 'ProArt PA32UCG', category: 'Professional Monitor', specs: {
    [S.price]: '$4,999', [S.msrp]: '$5,299', [S.status]: 'Shipping', [S.released]: '2021', [S.warranty]: '3 Years',
    [S.brightness]: '1,600 nits', [S.resolution]: '3840x2160', [S.contrast]: '1,000,000:1', [S.hdr]: 'Dolby Vision / HDR10',
    [S.refresh]: '120 Hz', [S.responseTime]: '5 ms', [S.inputLag]: '8 ms', [S.screenSize]: '32 inch', [S.panelTech]: 'IPS (mini-LED)',
    [S.speakers]: '6 W', [S.connectivity]: 'Thunderbolt 3, HDMI 2.1, DP', [S.weight]: '14.0 kg', [S.powerConsumption]: '250 W' } }),
  make({ brand: 'EIZO', model: 'ColorEdge CG2700X', category: 'Professional Monitor', specs: {
    [S.price]: '$3,599', [S.msrp]: '$3,799', [S.status]: 'Shipping', [S.released]: '2022', [S.warranty]: '5 Years',
    [S.brightness]: '400 nits', [S.resolution]: '3840x2160', [S.contrast]: '1,600:1', [S.hdr]: 'HDR (HLG/PQ)',
    [S.refresh]: '60 Hz', [S.responseTime]: '9 ms', [S.screenSize]: '27 inch', [S.panelTech]: 'IPS',
    [S.connectivity]: 'USB-C 92W, HDMI, DP x2', [S.weight]: '11.0 kg', [S.powerConsumption]: '186 W' } }),
  make({ brand: 'Samsung', model: 'ViewFinity S9', category: 'Professional Monitor', specs: {
    [S.price]: '$1,599', [S.msrp]: '$1,599', [S.status]: 'Shipping', [S.released]: '2023', [S.warranty]: '3 Years',
    [S.brightness]: '600 nits', [S.resolution]: '5120x2880', [S.contrast]: '2,500:1', [S.hdr]: 'HDR600',
    [S.refresh]: '60 Hz', [S.responseTime]: '5 ms', [S.screenSize]: '27 inch', [S.panelTech]: 'IPS',
    [S.connectivity]: 'Thunderbolt 4, USB-C, mini-DP', [S.weight]: '7.1 kg', [S.powerConsumption]: '110 W' } }),
  make({ brand: 'BenQ', model: 'PD3220U', category: 'Professional Monitor', specs: {
    [S.price]: '$1,199', [S.msrp]: '$1,399', [S.status]: 'Shipping', [S.released]: '2020', [S.warranty]: '3 Years',
    [S.brightness]: '300 nits', [S.resolution]: '3840x2160', [S.contrast]: '1,000:1', [S.hdr]: 'HDR10',
    [S.refresh]: '60 Hz', [S.responseTime]: '5 ms', [S.screenSize]: '31.5 inch', [S.panelTech]: 'IPS',
    [S.speakers]: '4 W', [S.connectivity]: 'Thunderbolt 3, HDMI, DP', [S.weight]: '11.0 kg', [S.powerConsumption]: '155 W' } }),

  // --- Interactive Displays --------------------------------------------
  make({ brand: 'Samsung', model: 'Flip Pro WMB', category: 'Interactive Display', specs: {
    [S.price]: '$2,799', [S.msrp]: '$2,999', [S.status]: 'Shipping', [S.released]: '2023', [S.warranty]: '3 Years',
    [S.brightness]: '350 nits', [S.resolution]: '3840x2160', [S.screenSize]: '65 inch', [S.panelTech]: 'LCD',
    [S.touchPoints]: '20', [S.speakers]: '20 W', [S.connectivity]: 'HDMI x2, USB-C, LAN', [S.weight]: '38 kg', [S.powerConsumption]: '250 W' } }),
  make({ brand: 'Microsoft', model: 'Surface Hub 3 50"', category: 'Interactive Display', specs: {
    [S.price]: '$8,999', [S.msrp]: '$8,999', [S.status]: 'Shipping', [S.released]: '2024', [S.warranty]: '1 Year',
    [S.brightness]: '450 nits', [S.resolution]: '3840x2160', [S.screenSize]: '50 inch', [S.panelTech]: 'LCD (PixelSense)',
    [S.touchPoints]: '20', [S.speakers]: '30 W', [S.connectivity]: 'USB-C, HDMI, Wi-Fi 6', [S.weight]: '28 kg', [S.powerConsumption]: '350 W' } }),
  make({ brand: 'ViewSonic', model: 'ViewBoard IFP7550', category: 'Interactive Display', specs: {
    [S.price]: '$2,299', [S.msrp]: '$2,599', [S.status]: 'Shipping', [S.released]: '2022', [S.warranty]: '3 Years',
    [S.brightness]: '400 nits', [S.resolution]: '3840x2160', [S.screenSize]: '75 inch', [S.panelTech]: 'LCD',
    [S.touchPoints]: '20', [S.speakers]: '16 W', [S.connectivity]: 'HDMI x3, USB-C, LAN', [S.weight]: '56 kg', [S.powerConsumption]: '400 W' } }),
  make({ brand: 'Promethean', model: 'ActivPanel 9', category: 'Interactive Display', specs: {
    [S.price]: '$3,499', [S.msrp]: '$3,799', [S.status]: 'Shipping', [S.released]: '2023', [S.warranty]: '5 Years',
    [S.brightness]: '400 nits', [S.resolution]: '3840x2160', [S.screenSize]: '75 inch', [S.panelTech]: 'LCD',
    [S.touchPoints]: '40', [S.speakers]: '20 W', [S.connectivity]: 'HDMI x3, USB-C, LAN', [S.weight]: '58 kg', [S.powerConsumption]: '420 W' } }),
  make({ brand: 'SMART', model: 'Board GX075', category: 'Interactive Display', specs: {
    [S.price]: '$2,599', [S.msrp]: '$2,899', [S.status]: 'Shipping', [S.released]: '2022', [S.warranty]: '3 Years',
    [S.brightness]: '350 nits', [S.resolution]: '3840x2160', [S.screenSize]: '75 inch', [S.panelTech]: 'LCD',
    [S.touchPoints]: '20', [S.speakers]: '16 W', [S.connectivity]: 'HDMI x2, USB-C, LAN', [S.weight]: '55 kg', [S.powerConsumption]: '380 W' } }),
  make({ brand: 'LG', model: 'CreateBoard 86TR3DK', category: 'Interactive Display', specs: {
    [S.price]: '$4,299', [S.msrp]: '$4,699', [S.status]: 'Shipping', [S.released]: '2023', [S.warranty]: '3 Years',
    [S.brightness]: '400 nits', [S.resolution]: '3840x2160', [S.screenSize]: '86 inch', [S.panelTech]: 'LCD',
    [S.touchPoints]: '40', [S.speakers]: '30 W', [S.connectivity]: 'HDMI x3, USB-C, LAN', [S.weight]: '70 kg', [S.powerConsumption]: '480 W' } }),

  // --- LED Video Walls --------------------------------------------------
  make({ brand: 'Samsung', model: 'The Wall IWA (146")', category: 'LED Video Wall', specs: {
    [S.price]: '$89,999', [S.msrp]: '$99,999', [S.status]: 'Made to Order', [S.released]: '2023', [S.warranty]: '2 Years',
    [S.brightness]: '1,600 nits', [S.resolution]: '3840x2160', [S.contrast]: '1,000,000:1', [S.screenSize]: '146 inch',
    [S.panelTech]: 'MicroLED', [S.pixelPitch]: '1.68 mm', [S.connectivity]: 'HDMI, DP, proprietary controller',
    [S.weight]: '200 kg', [S.powerConsumption]: '3,000 W' } }),
  make({ brand: 'LG', model: 'MAGNIT LSAB (136")', category: 'LED Video Wall', specs: {
    [S.price]: '$120,000', [S.msrp]: '$135,000', [S.status]: 'Made to Order', [S.released]: '2022', [S.warranty]: '2 Years',
    [S.brightness]: '1,200 nits', [S.resolution]: '3840x2160', [S.contrast]: '1,000,000:1', [S.screenSize]: '136 inch',
    [S.panelTech]: 'MicroLED', [S.pixelPitch]: '0.93 mm', [S.connectivity]: 'HDMI, DP, controller',
    [S.weight]: '180 kg', [S.powerConsumption]: '2,800 W' } }),
  make({ brand: 'Absen', model: 'Acclaim Plus (130")', category: 'LED Video Wall', specs: {
    [S.price]: '$45,000', [S.msrp]: '$52,000', [S.status]: 'Shipping', [S.released]: '2023', [S.warranty]: '3 Years',
    [S.brightness]: '800 nits', [S.resolution]: '1920x1080', [S.contrast]: '5,000:1', [S.screenSize]: '130 inch',
    [S.panelTech]: 'LED (SMD)', [S.pixelPitch]: '1.5 mm', [S.connectivity]: 'HDMI, DP, controller',
    [S.weight]: '150 kg', [S.powerConsumption]: '2,200 W' } }),
  make({ brand: 'Planar', model: 'TVF Series (120")', category: 'LED Video Wall', specs: {
    [S.price]: '$38,000', [S.msrp]: '$44,000', [S.status]: 'Shipping', [S.released]: '2021', [S.warranty]: '3 Years',
    [S.brightness]: '600 nits', [S.resolution]: '1920x1080', [S.contrast]: '5,000:1', [S.screenSize]: '120 inch',
    [S.panelTech]: 'LED (SMD)', [S.pixelPitch]: '1.9 mm', [S.connectivity]: 'HDMI, DP, controller',
    [S.weight]: '130 kg', [S.powerConsumption]: '2,000 W' } }),
];
