import { config } from './public-config.js';
// Session IDs expire after 30 min inactivity. No IP, name or order is stored.
if (config.url && config.key && !location.pathname.includes('/admin')) {
  try {
    const previous = JSON.parse(sessionStorage.getItem('dv-visit') || 'null');
    const id = previous && Date.now() - previous.time < 1800000 ? previous.id : crypto.randomUUID();
    sessionStorage.setItem('dv-visit', JSON.stringify({ id, time: Date.now() }));
    fetch(`${config.url}/functions/v1/page-view`, { method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: config.key },
      body: JSON.stringify({ id }), keepalive: true }).catch(() => {});
  } catch { /* Analytics must never block shopping. */ }
}
