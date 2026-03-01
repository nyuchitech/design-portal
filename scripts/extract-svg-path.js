import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// This script can be run locally to extract the SVG path and create the favicon
// Run: node scripts/extract-svg-path.js

const logoFile = readFileSync(join(process.cwd(), 'components/brand/mukoko-logo.tsx'), 'utf-8');
const pathMatch = logoFile.match(/<path d="([^"]+)"/);

if (!pathMatch) {
  console.error('Could not find SVG path data in mukoko-logo.tsx');
  process.exit(1);
}

const pathData = pathMatch[1];

const svgFavicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 375 375">
  <style>
    path { fill: #4B0082; }
    @media (prefers-color-scheme: dark) {
      path { fill: #B388FF; }
    }
  </style>
  <path d="${pathData}" />
</svg>`;

writeFileSync(join(process.cwd(), 'app/icon.svg'), svgFavicon);
console.log('Favicon written to app/icon.svg');
