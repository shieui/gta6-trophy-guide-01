// Leonida Trophy Guide — the program that hands the guide in (Node 22,
// standard library only). The guide itself is plain static files under app/
// (index.html, CSS, ES modules and data/trophies.json), served as-is with no
// build step, and the screenshots in screenshots/ are real renders of it.
//
// This file copies both folders into the output directory the grader gives
// it (/output, or $MAKEFUN_OUTPUT_DIR outside the grader) and writes
// /output/dossier.json with the vendored make.fun library — the summary the
// judge reads: the screenshots, the first load's files and bytes, and the
// source. vendor/makefun-frontend.ts stays exactly as the kit shipped it:
// the scorer rebuilds the dossier with its own copy and compares the two
// byte for byte, so this file must not touch the library or its options.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The scorer's own caps: the dossier text is capped, and the other limits
// refuse an entry the scorer would refuse anyway — more than 4 screenshots
// or one over 256 KiB, more than 993 files and directories in app/, or more
// than 48 MiB of app files (app/ counts beside /output's own cap of 1,000
// entries and 64 MiB, which the screenshots and dossier.json share).
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
