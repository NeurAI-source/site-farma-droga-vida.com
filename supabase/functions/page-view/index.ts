import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
const origin = Deno.env.get('SITE_ORIGIN') || '';
const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin' };
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
Deno.serve(async req => {
  if (req.headers.get('origin') !== origin) return new Response(null, { status: 403 });
  if (req.method === 'OPTIONS') return new Response(null, { headers });
  if (req.method !== 'POST') return new Response(null, { status: 405, headers });
  try {
    const raw = await req.text();
    if (raw.length > 100) throw Error();
    const { id } = JSON.parse(raw);
    if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) throw Error();
    const { error } = await db.rpc('record_view', { visitor: id });
    if (error) throw error;
    return new Response(null, { status: 204, headers });
  } catch { return new Response(null, { status: 400, headers }); }
});
