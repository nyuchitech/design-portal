import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

// Try multiple paths to find the logo source
const possiblePaths = [
  // In v0 sandbox, the project is at /vercel/share/v0-project
  '/vercel/share/v0-project/components/brand/mukoko-logo.tsx',
  // Local dev
  join(process.cwd(), 'components/brand/mukoko-logo.tsx'),
];

let pathData = '';

for (const p of possiblePaths) {
  try {
    const content = readFileSync(p, 'utf-8');
    const match = content.match(/<path d="([^"]+)"/);
    if (match) {
      pathData = match[1];
      console.log(`Found SVG path data from: ${p}`);
      console.log(`Path length: ${pathData.length} chars`);
      break;
    }
  } catch {
    console.log(`Could not read: ${p}`);
  }
}

if (!pathData) {
  console.error('Could not extract SVG path data from any source');
  process.exit(1);
}

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 375 375">
  <style>
    path { fill: #4B0082; }
    @media (prefers-color-scheme: dark) {
      path { fill: #B388FF; }
    }
  </style>
  <path d="${pathData}" />
</svg>`;

const outPath = '/vercel/share/v0-project/app/icon.svg';
try {
  mkdirSync(dirname(outPath), { recursive: true });
} catch {}
writeFileSync(outPath, svgContent);
console.log(`Favicon written to ${outPath}`);
console.log(`SVG size: ${svgContent.length} bytes`);
