import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Read the source SVG
const svgPath = join(projectRoot, 'public/icons/mukoko-logo-source.svg');
const svgSource = readFileSync(svgPath, 'utf-8');
console.log('SVG source length:', svgSource.length);

// Extract viewBox
const viewBoxMatch = svgSource.match(/viewBox="([^"]+)"/);
const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 375 375';
console.log('ViewBox:', viewBox);

// Extract all path elements
const pathRegex = /<path\s+fill="[^"]*"\s+d="([^"]+)"/g;
const pathDs = [];
let m;
while ((m = pathRegex.exec(svgSource)) !== null) {
  pathDs.push(m[1]);
}
console.log('Found', pathDs.length, 'paths');

// Build the JSX paths as a single string
const jsxPaths = pathDs.map(d => '        <path fill="currentColor" d="' + d + '" />').join('\n');

// Build the React component
const component = [
  '"use client"',
  '',
  'interface MukokoLogoProps {',
  '  className?: string',
  '  size?: number',
  '  showWordmark?: boolean',
  '  suffix?: string',
  '}',
  '',
  'export function MukokoLogo({',
  '  className = "",',
  '  size = 28,',
  '  showWordmark = true,',
  '  suffix,',
  '}: MukokoLogoProps) {',
  '  return (',
  '    <span className={`inline-flex items-center gap-2.5 ${className}`}>',
  '      <svg',
  '        className="shrink-0 text-[#4B0082] dark:text-[#B388FF]"',
  '        width={size}',
  '        height={size}',
  '        viewBox="' + viewBox + '"',
  '        fill="currentColor"',
  '        aria-hidden="true"',
  '      >',
  jsxPaths,
  '      </svg>',
  '',
  '      {showWordmark && (',
  '        <span className="flex items-baseline gap-1.5">',
  '          <span className="text-sm font-semibold tracking-tight text-foreground">',
  '            mukoko',
  '          </span>',
  '          {suffix && (',
  '            <span className="text-xs text-muted-foreground">{suffix}</span>',
  '          )}',
  '        </span>',
  '      )}',
  '    </span>',
  '  )',
  '}',
  '',
].join('\n');

mkdirSync(join(projectRoot, 'components/brand'), { recursive: true });
writeFileSync(join(projectRoot, 'components/brand/mukoko-logo.tsx'), component);
console.log('Wrote components/brand/mukoko-logo.tsx');

// Build favicon SVG with tanzanite
const faviconPaths = pathDs.map(d => '  <path fill="#B388FF" d="' + d + '" />').join('\n');
const favicon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + viewBox + '" width="32" height="32">\n' + faviconPaths + '\n</svg>';
writeFileSync(join(projectRoot, 'app/icon.svg'), favicon);
console.log('Wrote app/icon.svg');

// Build theme-adaptive icon
const adaptivePaths = pathDs.map(d => '  <path class="f" d="' + d + '" />').join('\n');
const adaptive = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + viewBox + '" width="32" height="32">',
  '  <style>.f{fill:#4B0082}@media(prefers-color-scheme:dark){.f{fill:#B388FF}}</style>',
  adaptivePaths,
  '</svg>'
].join('\n');
writeFileSync(join(projectRoot, 'public/icons/mukoko-icon-adaptive.svg'), adaptive);
console.log('Wrote public/icons/mukoko-icon-adaptive.svg');

console.log('Done!');
