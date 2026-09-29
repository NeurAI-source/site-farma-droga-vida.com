import { writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { validateCatalog } from '../catalog-validation.js';
// Read only the catalog already published by the administration workflow.
// No database administrator key is needed in Vercel.
const url = new URL('https://neurai-source.github.io/site-farma-droga-vida.com/catalog.json');
url.searchParams.set('build', Date.now().toString());
const response = await fetch(url, { signal: AbortSignal.timeout(30000), cache: 'no-store' });
if (!response.ok) throw Error('Não foi possível obter o catálogo publicado: ' + response.status);
const catalog = validateCatalog(await response.json());
await writeFile('published-catalog.json', JSON.stringify(catalog));
const build = spawnSync(process.execPath, ['scripts/build.mjs'], { stdio: 'inherit', env: { ...process.env, CATALOG_FILE: 'published-catalog.json' } });
if (build.error) throw build.error;
process.exitCode = build.status ?? 1;
