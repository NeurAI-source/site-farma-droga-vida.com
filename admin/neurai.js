import { money } from '../catalog-utils.js';
import { analyzePrices, applyPrices, catalogCheckup } from './neurai-utils.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function mountNeurAI({ getCatalog, getVersion, saveCatalog, onSaved, onEdit }) {
  const launcher = document.createElement('button');
  launcher.className = 'neur-launcher';
  launcher.type = 'button';
  launcher.hidden = true;
  launcher.textContent = '✦ Neur.AI';
  launcher.setAttribute('aria-haspopup', 'dialog');
  launcher.setAttribute('aria-label', 'Abrir assistente Neur.AI');
  const dialog = document.createElement('dialog');
  dialog.className = 'neur-dialog';
  dialog.setAttribute('aria-labelledby', 'neur-title');
  dialog.innerHTML = `<div class="editor-body">
    <div class="panel-heading"><div><p class="eyebrow">ASSISTENTE DO CATÁLOGO</p><h2 id="neur-title">Neur.AI</h2></div><button type="button" class="text-button" data-close>Fechar</button></div>
    <p>Remarque preços pelo código reduzido e confira pendências do cadastro.</p>
    <section aria-labelledby="neur-price-title"><h3 id="neur-price-title">Remarcação em lote</h3>
      <p>Um produto por linha: <strong>código + novo preço</strong>. Até 100 produtos. Confira a prévia antes de confirmar.</p>
      <label for="neur-input">Códigos e preços</label>
      <textarea id="neur-input" rows="6" maxlength="8000" spellcheck="false" placeholder="001234 19,99&#10;5678 8,50"></textarea>
      <button type="button" class="button red" data-analyze>Analisar lote</button>
      <p data-message role="status" aria-live="polite"></p>
      <div data-preview hidden></div>
      <button type="button" class="button red" data-confirm hidden>Confirmar alterações no rascunho</button>
      <p class="muted">A confirmação salva o rascunho na nuvem. Use “Publicar no site” no painel para atualizar o catálogo público.</p>
    </section>
    <section class="neur-checkup" aria-labelledby="neur-checkup-title"><div class="panel-heading"><h3 id="neur-checkup-title">Check-up do cadastro</h3><button type="button" class="text-button" data-refresh>Atualizar check-up</button></div><div data-checkup></div></section>
    <p class="muted">Análise automática baseada no catálogo. Este site ainda não registra buscas e interações por produto para gerar rankings de interesse.</p>
  </div>`;
  document.body.append(launcher, dialog);
  const $ = selector => dialog.querySelector(selector);
  const input = $('#neur-input'), confirm = $('[data-confirm]'), preview = $('[data-preview]'), message = $('[data-message]');
  let rows = [], previewVersion, busy = false;

  function reset() { rows = []; preview.hidden = true; preview.replaceChildren(); confirm.hidden = true; message.textContent = ''; }
  function checkup() {
    const issues = catalogCheckup(getCatalog().products);
    $('[data-checkup]').innerHTML = issues.length
      ? `<p>${issues.length} produtos para revisar.</p><ul class="neur-issues">${issues.map(p => `<li><div><strong>${esc(p.name)}</strong><p>${p.issues.map(esc).join(' · ')}</p></div><button type="button" class="text-button" data-neur-edit="${p.id}">Editar</button></li>`).join('')}</ul>`
      : '<p>Nenhuma pendência encontrada nestas verificações.</p>';
  }
  launcher.onclick = () => { if (!getCatalog()) return; reset(); checkup(); dialog.showModal(); };
  $('[data-close]').onclick = () => { if (!busy) dialog.close(); };
  dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  dialog.addEventListener('click', event => {
    const button = event.target.closest('[data-neur-edit]');
    if (button && !busy) { dialog.close(); onEdit(Number(button.dataset.neurEdit)); }
  });
  $('[data-refresh]').onclick = checkup;
  input.oninput = reset;
  $('[data-analyze]').onclick = () => {
    reset();
    try {
      rows = analyzePrices(input.value, getCatalog().products);
      previewVersion = getVersion();
      const errors = rows.filter(row => row.error).length;
      message.textContent = errors ? `${errors} linhas precisam de correção. Nenhum preço será alterado enquanto houver erros.` : `${rows.length} produtos identificados. Confira os preços abaixo.`;
      preview.innerHTML = `<div class="table-scroll"><table><caption>Prévia da remarcação</caption><thead><tr><th>Produto e código</th><th>Preço atual</th><th>Novo preço</th><th>Status</th></tr></thead><tbody>${rows.map(row => `<tr><td><strong>${esc(row.name || row.raw)}</strong><small>Linha ${row.line} · ${esc(row.code)}</small></td><td>${row.previousCents != null ? money(row.previousCents) : '—'}</td><td>${row.priceCents ? money(row.priceCents) : '—'}</td><td>${esc(row.error || 'Pronto')}</td></tr>`).join('')}</tbody></table></div>`;
      preview.hidden = false;
      confirm.hidden = errors > 0;
      confirm.textContent = `Confirmar ${rows.length} alterações no rascunho`;
    } catch (error) { message.textContent = error.message; }
  };
  confirm.onclick = async () => {
    if (busy || !rows.length) return;
    busy = true;
    dialog.querySelectorAll('button, textarea').forEach(element => element.disabled = true);
    try {
      if (previewVersion !== getVersion()) throw Error('O catálogo mudou. Analise o lote novamente.');
      const next = applyPrices(getCatalog(), rows);
      await saveCatalog(next);
      const count = rows.length;
      input.value = '';
      reset();
      onSaved();
      checkup();
      message.textContent = `${count} preços salvos no rascunho. Publique pelo painel quando estiver pronto.`;
    } catch (error) {
      reset();
      message.textContent = error.message;
    } finally {
      busy = false;
      dialog.querySelectorAll('button, textarea').forEach(element => element.disabled = false);
    }
  };
  return { enable() { launcher.hidden = false; } };
}
