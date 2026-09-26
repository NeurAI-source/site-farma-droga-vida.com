import { money, filterProducts, sanitizeCart, cartTotal, orderMessage } from './catalog-utils.js';
const paths = {
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  cart:'<path d="M2 3h3l3 13h11l3-10H6m3 6h11"/><circle cx="10" cy="21" r="1"/><circle cx="18" cy="21" r="1"/>',
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  truck:'<path d="M1 4h13v13H1zM14 9h5l4 4v4h-9M4 8H1"/><circle cx="5" cy="18" r="3"/><circle cx="18" cy="18" r="3"/>',
  tag:'<path d="M20 3h-8L2 13l9 9L22 11V3z"/><circle cx="17" cy="8" r="1"/>',
  user:'<circle cx="12" cy="7" r="4"/><path d="M3 22v-3a9 9 0 0 1 18 0v3Z"/>',
  pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
  pill:'<path d="m9 3-6 6a7 7 0 0 0 10 10l6-6A7 7 0 0 0 9 3Zm-3 3 12 12M12 5l4 4"/>',
  bottle:'<path d="M8 9h8a3 3 0 0 1 3 3v9H5v-9a3 3 0 0 1 3-3Zm2 0V4h4v5M8 2h9v2M8 14h8"/>',
  leaf:'<path d="M12 22C5 19 2 14 3 7c6 0 11 4 10 11M12 22c-2-10 1-17 10-20 1 9-2 15-9 18M7 12l5 10m5-13-5 13"/>',
  baby:'<path d="M5 8a9 9 0 0 1 14 0M4 9a3 3 0 0 0 0 6 8 8 0 0 0 16 0 3 3 0 0 0 0-6M10 4c0-4 5-4 5-1 0 2-2 3-3 3M8 12h.1M16 12h.1M9 16q3 3 6 0"/>',
  flower:'<path d="M12 21C4 19 2 15 2 10c6 0 10 3 10 11Zm0 0c8-2 10-6 10-11-6 0-10 3-10 11Zm0-1C5 13 7 7 12 2c5 5 7 11 0 18Z"/>',
  bolt:'<path d="M13 2 3 14h7l-1 8L21 9h-8l1-7Z"/>',
  percent:'<circle cx="12" cy="12" r="10"/><path d="m8 16 8-8"/><circle cx="8" cy="8" r="1.5"/><circle cx="16" cy="16" r="1.5"/>',
  shield:'<path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6zM8 12l3 3 6-6"/>',
  store:'<path d="M3 10v12h18V10M2 3h20v5a3 3 0 0 1-5 2 3 3 0 0 1-5 0 3 3 0 0 1-5 0 3 3 0 0 1-5-2ZM9 22v-8h6v8"/>',
  message:'<path d="M21 11.5a9 9 0 0 1-9.5 9 10 10 0 0 1-4-.9L2 22l1.8-5.4a9 9 0 1 1 17.2-5.1Z"/><path d="M8 7c-2 4 1 7 5 9l3-2-3-2-1 1-3-3 1-1Z"/>',
  phone:'<path d="m4 3 4-1 3 5-2 2c1 3 3 5 6 6l2-2 5 3-1 4C10 24 0 13 4 3Z"/>',
  plus:'<path d="M12 4v16M4 12h16"/>',close:'<path d="m5 5 14 14M19 5 5 19"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.heart}</svg>`;
const renderIcons = (root = document) => root.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon));
renderIcons();
const $ = s => document.querySelector(s);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* The catalog also works without browser storage. */ } };
let products = [], cart = [], favorites = [], category = 'Todos', subcategory = '', query = '', favoriteOnly = false, all = false, limit = 12, toastTimer;
const featuredIds = [31, 32, 41, 5, 3, 6];
const whatsapp = text => `https://wa.me/5517996630482?text=${encodeURIComponent(text)}`;
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3000); }
function openDialog(dialog) { if (!dialog.open) dialog.showModal(); }
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelectorAll('[data-close]').forEach(button => button.onclick = () => dialog.close());
  dialog.addEventListener('click', event => { if(event.target === dialog) { const r = dialog.getBoundingClientRect(); if(event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
});
function updateCounts() {
  $('#cart-count').textContent = cart.reduce((s, i) => s+i.qty, 0); $('#cart-total').textContent = money(cartTotal(cart, products));
  $('#favorite-count').textContent = favorites.length; $('#favorites').setAttribute('aria-pressed', String(favoriteOnly));
  save('dv-cart', cart); save('dv-favorites', favorites);
}
function productCard(p) {
  const discount = p.oldPriceCents > p.priceCents ? Math.round((1-p.priceCents/p.oldPriceCents)*100) : 0;
  return `<article class="product-card"><button class="favorite" data-favorite="${p.id}" aria-label="${favorites.includes(p.id)?'Remover':'Adicionar'} ${escape(p.name)} ${favorites.includes(p.id)?'dos':'aos'} favoritos" aria-pressed="${favorites.includes(p.id)}">${icon('heart')}</button><button class="product-image" data-detail="${p.id}" aria-label="Ver detalhes de ${escape(p.name)}"><img src="${escape(p.imageUrl)}" alt="${escape(p.name)}" loading="lazy" width="180" height="180">${discount ? `<span class="discount">-${discount}%</span>`:''}</button><p class="product-category">${escape(p.category === 'Perfumaria e Cuidados Pessoais' ? 'Cuidados pessoais' : p.category)}</p><h3><button data-detail="${p.id}">${escape(p.name)}</button></h3><p class="product-detail">${escape(p.variants.length ? 'Vários tamanhos disponíveis' : p.detail)}</p><div class="product-price">${p.oldPriceCents > p.priceCents ? `<del>${money(p.oldPriceCents)}</del>`:''}<strong>${money(p.priceCents)}</strong></div><button class="add-button" data-add="${p.id}">${icon('cart')} ${p.variants.length ? 'Escolher tamanho':'Adicionar'}</button></article>`;
}
function renderProducts() {
  const filtered = filterProducts(products, { category, subcategory, query, favorites: favoriteOnly ? favorites : null });
  const displayed = all || category !== 'Todos' || query || favoriteOnly ? filtered : featuredIds.map(id => products.find(p => p.id === id)).filter(Boolean);
  $('#products-title').textContent = favoriteOnly ? 'Seus favoritos' : query ? 'Resultado da busca' : category !== 'Todos' ? (subcategory || category) : all ? 'Todos os produtos' : 'Produtos em destaque';
  $('#results').textContent = `${displayed.length} ${displayed.length === 1 ? 'produto encontrado':'produtos encontrados'}${query ? ` para “${query}”` : ''}`;
  $('#products').innerHTML = displayed.length ? displayed.slice(0,limit).map(productCard).join('') : `<div class="empty"><h3>${favoriteOnly ? 'Seus favoritos ficam aqui.' : 'Não encontramos produtos nesta seleção.'}</h3><p>${favoriteOnly ? 'Toque no coração dos produtos que você gosta.' : 'Nossa equipe pode consultar a disponibilidade para você.'}</p><a class="button red-button" href="${whatsapp('Olá! Gostaria de consultar '+(query || subcategory || category)+'.')}" target="_blank" rel="noopener noreferrer">Consultar no WhatsApp ${icon('arrow')}</a></div>`;
  $('#load-more').hidden = displayed.length <= limit; $('#clear-filters').hidden = category === 'Todos' && !query && !favoriteOnly && !subcategory;
  $('#show-all').hidden = all;
  document.querySelectorAll('#filters [data-category]').forEach(el => el.setAttribute('aria-pressed',String(el.dataset.category === category)));
  updateCounts();
}
function selectCategory(name, sub = '') { category=name; subcategory=sub; all=true; query=''; $('#search').value=''; favoriteOnly=false; limit=12; renderProducts(); $('#ofertas').scrollIntoView({behavior:'smooth'}); }
document.addEventListener('click', event => {
  const categoryButton = event.target.closest('[data-category]'); if (categoryButton) selectCategory(categoryButton.dataset.category, categoryButton.dataset.subcategory || '');
  const fav = event.target.closest('[data-favorite]'); if(fav) { const id=Number(fav.dataset.favorite); favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id]; renderProducts(); }
  const detail = event.target.closest('[data-detail]'); if(detail) showDetail(Number(detail.dataset.detail));
  const add = event.target.closest('[data-add]'); if(add) { const p=products.find(p=>p.id===Number(add.dataset.add)); if(p.variants.length) showDetail(p.id); else addToCart(p.id); }
});
function addToCart(id, variant='') { const found=cart.find(i=>i.id===id && i.variant===variant); if(found?.qty===99) {toast('Limite de 99 unidades por item.');return;} if(found)found.qty++;else cart.push({id,variant,qty:1}); cart=sanitizeCart(cart,products);updateCounts();renderCart();toast('Produto adicionado ao carrinho'); }
function showDetail(id) {
  const p=products.find(p=>p.id===id); if(!p)return;
  $('#detail-content').innerHTML=`<div class="detail-grid"><img src="${escape(p.imageUrl)}" alt="${escape(p.name)}"><div><p class="eyebrow red">${escape(p.category)}</p><h2>${escape(p.name)}</h2><p>${escape(p.detail)}${p.brand ? ' · '+escape(p.brand):''}</p><div class="product-price">${p.oldPriceCents>p.priceCents?`<del>${money(p.oldPriceCents)}</del>`:''}<strong>${money(p.priceCents)}</strong></div>${p.variants.length?`<label for="variant">Escolha o tamanho<select id="variant"><option value="">Selecione uma opção</option>${p.variants.map(v=>`<option value="${escape(v.size)}">${escape(v.size)} — ${v.packageQuantity} unidades</option>`).join('')}</select></label>`:''}<p>Consulte a disponibilidade ${p.availableStore1&&p.availableStore2?'nas duas lojas':p.availableStore1?'na Loja 1':'na Loja 2'}. Preço sujeito à confirmação.</p><button class="button red-button" id="detail-add">${icon('cart')} Adicionar ao carrinho</button></div></div>`;
  $('#detail-add').onclick=()=>{const variant=p.variants.length?$('#variant').value:'';if(p.variants.length&&!variant){$('#variant').focus();toast('Escolha o tamanho para continuar.');return;}addToCart(id,variant);$('#detail-dialog').close();};
  openDialog($('#detail-dialog'));
}
function renderCart() {
  $('#cart-items').innerHTML=cart.length?cart.map((item,index)=>{const p=products.find(p=>p.id===item.id); const variant=p.variants.find(v=>v.size===item.variant);return `<article class="cart-item"><img src="${escape(p.imageUrl)}" alt="${escape(p.name)}"><div><h3>${escape(p.name)}</h3><p>${variant?`${escape(variant.size)} · ${variant.packageQuantity} unidades`:escape(p.detail)}</p><strong>${money(p.priceCents*item.qty)}</strong><div class="quantity"><button data-qty="${index}" data-delta="-1" aria-label="Diminuir quantidade de ${escape(p.name)}">−</button><span>${item.qty}</span><button data-qty="${index}" data-delta="1" aria-label="Aumentar quantidade de ${escape(p.name)}">+</button><button data-remove="${index}">Remover</button></div></div></article>`}).join(''):`<div class="empty"><h3>Seu carrinho está esperando por você.</h3><p>Escolha seus produtos e combine tudo com a nossa equipe.</p><button id="continue-shopping" class="button red-button">Ver produtos ${icon('arrow')}</button></div>`;
  $('#cart-summary').innerHTML=cart.length?`<div class="cart-subtotal"><span>Total estimado</span><span>${money(cartTotal(cart,products))}</span></div><p class="cart-footnote">Valores e disponibilidade serão confirmados pela equipe. Frete, se houver, será informado no atendimento. Nenhum pagamento é realizado neste site.</p><a class="button red-button checkout" href="${whatsapp(orderMessage(cart,products))}" target="_blank" rel="noopener noreferrer">${icon('message')} Continuar no WhatsApp ${icon('arrow')}</a>`:'';
  $('#continue-shopping')?.addEventListener('click',()=>{$('#cart-dialog').close();selectCategory('Todos');});
}
$('#cart-items').addEventListener('click',event=>{const qty=event.target.closest('[data-qty]'), remove=event.target.closest('[data-remove]');if(qty){const i=Number(qty.dataset.qty);cart[i].qty=Math.min(99,cart[i].qty+Number(qty.dataset.delta));cart=cart.filter(i=>i.qty>0);}if(remove)cart.splice(Number(remove.dataset.remove),1);if(qty||remove){updateCounts();renderCart();}});
document.querySelectorAll('.cart-trigger').forEach(b=>b.onclick=()=>{renderCart();openDialog($('#cart-dialog'));});
$('#search-form').addEventListener('submit',event=>{event.preventDefault();query=$('#search').value;all=true;category='Todos';subcategory='';favoriteOnly=false;limit=12;renderProducts();$('#ofertas').scrollIntoView({behavior:'smooth'});});
$('#search').addEventListener('input',()=>{query=$('#search').value;all=true;category='Todos';subcategory='';favoriteOnly=false;limit=12;renderProducts();});
$('#show-all').onclick=()=>selectCategory('Todos'); $('#load-more').onclick=()=>{limit+=12;renderProducts();};
document.querySelectorAll('a[href="#ofertas"]').forEach(link => link.addEventListener('click', () => selectCategory('Todos')));
$('#clear-filters').onclick=()=>selectCategory('Todos'); $('#favorites').onclick=()=>{favoriteOnly=!favoriteOnly;all=true;category='Todos';subcategory='';query='';$('#search').value='';limit=12;renderProducts();};
$('#contact-form').addEventListener('submit',event=>{event.preventDefault();const data=new FormData(event.currentTarget);const text=`Olá, sou ${String(data.get('name')).trim()}.\n\n${String(data.get('message')).trim()}`;window.open(whatsapp(text),'_blank','noopener,noreferrer');});
$('#privacy').onclick=()=>openDialog($('#privacy-dialog')); $('#clear-data').onclick=()=>{cart=[];favorites=[];renderProducts();renderCart();toast('Carrinho e favoritos apagados deste navegador.');};
$('#year').textContent=new Date().getFullYear();
try {
  const response=await fetch('./catalog.json'); if(!response.ok) throw new Error('Catálogo indisponível'); const data=await response.json(); products=data.products;
  cart=sanitizeCart(read('dv-cart',[]),products); const storedFavorites=read('dv-favorites',[]); favorites=Array.isArray(storedFavorites)?[...new Set(storedFavorites)].filter(id=>products.some(p=>p.id===id)):[];
  $('#filters').innerHTML=['Todos',...data.categories.map(c=>c.name)].map(c=>`<button data-category="${escape(c)}" aria-pressed="${c==='Todos'}">${escape(c==='Perfumaria e Cuidados Pessoais'?'Beleza e cuidados':c)}</button>`).join('');
  renderProducts();
} catch(error) {
  $('#results').textContent='Não foi possível carregar o catálogo.';$('#products').innerHTML=`<div class="empty"><h3>Estamos aqui para ajudar.</h3><p>Consulte nossos produtos diretamente com a equipe.</p><a class="button red-button" href="https://wa.me/5517996630482" target="_blank" rel="noopener noreferrer">Falar no WhatsApp</a></div>`;
}
