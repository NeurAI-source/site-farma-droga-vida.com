export function allowedOrigin(configured, requested) {
  if (!requested) return null;
  const allowed = configured.split(',').map(value => value.trim()).filter(Boolean);
  return allowed.includes(requested) ? requested : null;
}
