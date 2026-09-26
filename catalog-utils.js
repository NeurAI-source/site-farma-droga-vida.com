export const money = cents => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
export const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function filterProducts(products, { category = 'Todos', subcategory = '', query = '', favorites = null } = {}) {
  return products.filter(p => p.active && (category === 'Todos' || p.category === category) && (!subcategory || p.subcategory === subcategory) && (!favorites || favorites.includes(p.id)) && normalize([p.name,p.brand,p.detail,p.category,p.subcategory].join(' ')).includes(normalize(query.trim())));
}
export function sanitizeCart(value, products) {
  if (!Array.isArray(value)) return [];
  const merged = new Map();
  for (const item of value) {
    if (!item || !Number.isInteger(item.qty) || item.qty < 1) continue;
    const product = products.find(p => p.id === item.id && p.active);
    if (!product) continue;
    const variant = item.variant || '';
    if (product.variants.length ? !product.variants.some(v => v.size === variant) : variant !== '') continue;
    const key = `${product.id}:${variant}`;
    merged.set(key, { id: product.id, variant, qty: Math.min(99, (merged.get(key)?.qty || 0) + item.qty) });
  }
  return [...merged.values()];
}
export function cartTotal(cart, products) { return cart.reduce((sum, item) => sum + products.find(p => p.id === item.id).priceCents * item.qty, 0); }
export function orderMessage(cart, products) {
  return 'Olá! Gostaria de consultar a disponibilidade deste pedido na Droga Vida Popular:\n\n' + cart.map(item => {
    const p = products.find(p => p.id === item.id); const v = p.variants.find(v => v.size === item.variant);
    return `${item.qty} × ${p.name}${v ? ` — ${v.size}, ${v.packageQuantity} unidades` : ` — ${p.detail}`} — ${money(p.priceCents * item.qty)}`;
  }).join('\n') + `\n\nTotal estimado: ${money(cartTotal(cart, products))}.\nPodem confirmar os preços, o estoque e as opções de entrega ou retirada?`;
}
