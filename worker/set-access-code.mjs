// Change or add one person's song-search access code.
//
//   node worker/set-access-code.mjs <name> <new code>
//   node worker/set-access-code.mjs friend2 --remove
//
// The list of codes is kept OUTSIDE this public repo, in your user folder
// (smart-guitar-access-codes.txt). This script updates that file and uploads the whole
// list to the Cloudflare Worker as the ACCESS_CODES secret.

import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const CODES_FILE = path.join(os.homedir(), 'smart-guitar-access-codes.txt');
const HEADER = 'Smart Guitar song-search access codes (keep private, do NOT commit)';

const [name, ...rest] = process.argv.slice(2);
const value = rest.join(' ').trim();
if (!name || !value) {
  console.error('Usage: node worker/set-access-code.mjs <name> <new code>   (or --remove)');
  process.exit(1);
}
if (/[,:]/.test(name) || /[,:]/.test(value)) {
  console.error('Names and codes cannot contain commas or colons.');
  process.exit(1);
}
if (value !== '--remove' && value.length < 6) {
  console.error('Pick a code with at least 6 characters.');
  process.exit(1);
}

const entries = new Map();
if (fs.existsSync(CODES_FILE)) {
  fs.readFileSync(CODES_FILE, 'utf8').split(/\r?\n/).forEach((line) => {
    const m = line.match(/^([^:\s][^:]*):\s*(.+)$/);
    if (m && !line.startsWith(HEADER)) entries.set(m[1].trim(), m[2].trim());
  });
}

if (value === '--remove') entries.delete(name);
else entries.set(name, value);

const lower = [...entries.values()].map((c) => c.toLowerCase());
if (new Set(lower).size !== lower.length) {
  console.error('That code is already used by someone else. Pick a different one.');
  process.exit(1);
}

fs.writeFileSync(
  CODES_FILE,
  HEADER + '\r\n' + [...entries].map(([n, c]) => `${n}:  ${c}`).join('\r\n') + '\r\n'
);

const secret = [...entries].map(([n, c]) => `${n}:${c}`).join(',');
const workerDir = path.dirname(fileURLToPath(import.meta.url));
execSync('npx wrangler secret put ACCESS_CODES', { cwd: workerDir, input: secret, stdio: ['pipe', 'ignore', 'inherit'] });

console.log(value === '--remove' ? `Removed "${name}".` : `Saved the code for "${name}".`);
console.log(`People with access: ${[...entries.keys()].join(', ') || 'nobody'}`);
