import { createClient } from '@supabase/supabase-js';
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { validateCatalog } from '../catalog-validation.js';
const action = process.argv[2];
if (action === 'prepare') {
  await mkdir('supabase/functions/_shared', { recursive: true });
  await cp('catalog-validation.js', 'supabase/functions/_shared/catalog-validation.js');
  process.exit(0);
}
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PUBLICATION_ID } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw Error('Supabase server configuration is missing.');
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
function check(result) { if (result.error) throw Error(result.error.message); return result.data; }
if (action === 'seed') {
  const catalog = validateCatalog(JSON.parse(await readFile('catalog.json', 'utf8')));
  check(await db.from('catalog_draft').upsert({ id: 1, catalog }, { onConflict: 'id', ignoreDuplicates: true }));
  console.log('Catálogo inicial preparado; rascunhos existentes preservados.');
} else if (action === 'fetch') {
  let catalog;
  if (PUBLICATION_ID) {
    const row = check(await db.from('publications').update({status:'building'}).eq('id', PUBLICATION_ID).eq('status','pending').select('catalog').single());
    catalog = row.catalog;
  } else {
    const rows = check(await db.from('publications').select('catalog').eq('status','published').order('created_at',{ascending:false}).limit(1));
    catalog = rows[0]?.catalog || JSON.parse(await readFile('catalog.json', 'utf8'));
  }
  await writeFile('published-catalog.json', JSON.stringify(validateCatalog(catalog)));
} else if (['published','failed'].includes(action) && PUBLICATION_ID) {
  check(await db.from('publications').update({ status:action, finished_at:new Date().toISOString() }).eq('id',PUBLICATION_ID).in('status',['pending','building']));
} else if (!['published','failed'].includes(action)) throw Error('Unknown action');
