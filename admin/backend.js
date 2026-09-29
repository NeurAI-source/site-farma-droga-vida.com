import { createClient } from '../vendor/supabase.js';
import { config } from '../public-config.js';
export const client = config.url && config.key ? createClient(config.url, config.key) : null;
export async function adminAction(action, payload = {}) {
  const { data, error } = await client.functions.invoke('admin-api', { body: { action, ...payload } });
  if (error) {
    let message;
    try { const response = await error.context?.json(); if (typeof response?.error === 'string') message = response.error; } catch {}
    throw new Error(message || 'Não foi possível concluir. Confira sua permissão e a conexão do serviço.');
  }
  if (data.error) throw new Error(data.error);
  return data;
}
