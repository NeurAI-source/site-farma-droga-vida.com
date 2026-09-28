import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
// Copy shared validator into _shared when deploying (npm run prepare:functions).
import { validateCatalog } from '../_shared/catalog-validation.js';
const env = (key: string) => Deno.env.get(key) || '';
const origin = env('SITE_ORIGIN');
const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json', 'Vary': 'Origin' };
const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } });
Deno.serve(async req => {
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (req.headers.get('origin') !== origin) return reply({ error: 'Origem não autorizada.' }, 403);
  if (req.method === 'OPTIONS') return new Response(null, { headers });
  if (req.method !== 'POST') return reply({ error: 'Método inválido.' }, 405);
  try {
    const token = req.headers.get('authorization')?.replace(/^Bearer /i, '') || '';
    const { data: { user }, error: authError } = await db.auth.getUser(token);
    if (authError || !user) return reply({ error: 'Faça login novamente.' }, 401);
    const { data: member } = await db.from('team_members').select('role').eq('user_id', user.id).eq('active', true).single();
    if (!member) return reply({ error: 'Usuário não autorizado.' }, 403);
    const raw = await req.text();
    if (raw.length > 20000) return reply({ error: 'Solicitação muito grande.' }, 413);
    const body = JSON.parse(raw);
    if (member.role !== 'admin') return reply({ error: 'Somente administradores podem fazer isso.' }, 403);
    if (body.action === 'create-user') {
      const { email, password, role } = body;
      if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        || typeof password !== 'string' || password.length < 12 || password.length > 128 || !['admin','editor'].includes(role))
        return reply({ error: 'Informe e-mail, senha com pelo menos 12 caracteres e perfil válido.' }, 400);
      const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
      if (error) return reply({ error: 'Não foi possível cadastrar esse e-mail. Confira se já está cadastrado.' }, 400);
      const { error: insertError } = await db.from('team_members').insert({ user_id: data.user.id, role });
      if (insertError) { await db.auth.admin.deleteUser(data.user.id); throw insertError; }
      return reply({ ok: true });
    }
    if (body.action === 'publish') {
      const { data: draft, error } = await db.from('catalog_draft').select('*').eq('id', 1).single();
      if (error || !draft || draft.version !== body.version) return reply({ error: 'O catálogo mudou. Recarregue antes de publicar.' }, 409);
      validateCatalog(draft.catalog);
      if (!env('GITHUB_DEPLOY_TOKEN')) return reply({ error: 'A publicação ainda não foi configurada.' }, 503);
      const { data: publication, error: insertError } = await db.from('publications').insert({ catalog: draft.catalog, draft_version: draft.version, created_by: user.id }).select('id').single();
      if (insertError) return reply({ error: 'Já existe uma publicação em andamento. Aguarde ou consulte o administrador.' }, 409);
      try {
        const response = await fetch(`https://api.github.com/repos/${env('GITHUB_REPOSITORY')}/actions/workflows/publish.yml/dispatches`, {
          method: 'POST', headers: { Authorization: `Bearer ${env('GITHUB_DEPLOY_TOKEN')}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
          body: JSON.stringify({ ref: 'main', inputs: { publication_id: publication.id } })
        });
        if (!response.ok) {
          await db.from('publications').update({ status: 'failed', finished_at: new Date().toISOString() }).eq('id', publication.id);
          return reply({ error: 'O GitHub não aceitou a publicação. Verifique a configuração.' }, 502);
        }
      } catch {
        // An uncertain dispatch may have reached GitHub: leave pending to prevent duplicate deploys.
        return reply({ error: 'Não foi possível confirmar o envio. Confira o GitHub Actions antes de tentar novamente.' }, 502);
      }
      return reply({ id: publication.id, status: 'pending' });
    }
    return reply({ error: 'Ação inválida.' }, 400);
  } catch { return reply({ error: 'Não foi possível concluir a operação.' }, 500); }
});
