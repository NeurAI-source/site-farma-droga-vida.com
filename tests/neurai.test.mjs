import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzePrices, applyPrices, catalogCheckup } from '../admin/neurai-utils.js';
const products = [
  {id:1,shortCode:'0012',name:'Sabonete',brand:'Marca',detail:'70g',priceCents:675,oldPriceCents:800},
  {id:2,shortCode:'12',name:'Shampoo',brand:'Marca',detail:'100mL',priceCents:1499,oldPriceCents:0},
];
test('price batch matches exact code, preserves zeros, and changes only reviewed prices', () => {
  const catalog = {products};
  const rows = analyzePrices('0012 5,99\n12 R$ 19.90', products);
  assert.ok(rows.every(r=>!r.error));
  const next = applyPrices(catalog, rows);
  assert.deepEqual(next.products.map(p=>p.priceCents), [599,1990]);
  assert.equal(next.products[0].oldPriceCents,800);
  assert.equal(next.products[0].shortCode,'0012');
  assert.deepEqual(products.map(p=>p.priceCents),[675,1499]);
});
test('unknown, repeated, ambiguous and malformed codes block the entire batch', () => {
  for (const input of ['0012 5,99\nmissing 9,99','0012 5,99\n0012 6,99','0012 0','0012 -5','0012 1,234','0012 2 19,99','0012 12,3.4']) {
    const rows = analyzePrices(input,products);
    assert.ok(rows.some(r=>r.error), input);
    assert.throws(()=>applyPrices({products},rows));
  }
  assert.ok(analyzePrices('0012 5,99',[...products,{...products[0],id:3}])[0].error);
  assert.throws(()=>analyzePrices('',products));
  assert.throws(()=>analyzePrices(Array(101).fill('12 1,00').join('\n'),products));
});
test('stale preview never overwrites changed prices or codes', () => {
  const rows = analyzePrices('0012 5,99',products);
  for (const patch of [{priceCents:777},{shortCode:'2222'},{id:99}]) {
    const changed = structuredClone(products); Object.assign(changed[0],patch);
    assert.throws(()=>applyPrices({products:changed},rows), /catálogo mudou/);
  }
});
test('checkup reports missing codes and potential duplicate presentations without changing products', () => {
  const duplicate = {...products[0],id:3,shortCode:''};
  const result = catalogCheckup([...products,duplicate]);
  assert.equal(result.length,2);
  assert.ok(result.find(p=>p.id===3).issues.includes('Sem código reduzido'));
  assert.equal(duplicate.shortCode,'');
});
