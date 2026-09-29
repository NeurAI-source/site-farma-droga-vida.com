import test from 'node:test';
import assert from 'node:assert/strict';
import {allowedOrigin} from '../supabase/functions/cors.js';
test('custom domain accepts only explicitly configured origins',()=>{
 const configured='https://neurai-source.github.io, https://drogavidapopular.com.br';
 assert.equal(allowedOrigin(configured,'https://drogavidapopular.com.br'),'https://drogavidapopular.com.br');
 for(const origin of [null,'null','http://drogavidapopular.com.br','https://drogavidapopular.com.br.evil.test','https://evil.drogavidapopular.com.br']) assert.equal(allowedOrigin(configured,origin),null);
});
