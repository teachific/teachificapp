#!/usr/bin/env node
/**
 * Post-build script: removes the <script id="manus-runtime">...</script> block
 * injected by vite-plugin-manus-runtime from dist/public/index.html.
 * This script is only needed for external deployments (e.g. Railway) where
 * the Manus runtime overlay is not desired.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.resolve(__dirname, '../dist/public/index.html');

if (!fs.existsSync(indexPath)) {
  console.log('[strip-manus-runtime] dist/public/index.html not found, skipping.');
  process.exit(0);
}

let html = fs.readFileSync(indexPath, 'utf-8');
const before = html.length;

// Remove <script id="manus-runtime">...</script> (may span multiple lines)
// The script tag starts with <script id="manus-runtime"> and ends with </script>
html = html.replace(/<script\s+id="manus-runtime"[\s\S]*?<\/script>/g, '');

const after = html.length;
fs.writeFileSync(indexPath, html, 'utf-8');
console.log(`[strip-manus-runtime] Removed ${before - after} bytes of manus-runtime script from index.html`);
