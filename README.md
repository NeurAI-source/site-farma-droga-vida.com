# Droga Vida Popular

Site responsivo baseado no mockup fornecido. Catálogo com 41 produtos, imagens, preços, tamanhos, busca, categorias, favoritos e carrinho. O cliente revisa o pedido e conclui o atendimento pelo WhatsApp da loja.

## Executar

Requer Node.js 22 ou superior.

```sh
npm ci
npm run dev
npm test
npm run build
```

Abra http://127.0.0.1:4173. `dist/` contém o site estático para hospedagem, inclusive em um subdiretório.

## Dados e manutenção

- Fonte: https://site-do-erick.erick-fabrini3.chatgpt.site/ — importação em 26/09/2026.
- `catalog.json`: produtos, categorias, preços em centavos e tamanhos. Imagens em `assets/products/`.
- `index.html`: endereços, horários, telefones e conteúdo institucional.
- `app.js`: atendimento pelo WhatsApp `5517996630482`.
- `styles.css`: layout responsivo, cores e tipografia.
- A foto da família foi gerada para este projeto. Logo, produtos e fotos das lojas vieram do site fornecido.

O catálogo inicial foi importado da fonte indicada. A integração Supabase permite editar rascunhos e publicar pelo painel depois da ativação descrita em [SUPABASE-SETUP.md](SUPABASE-SETUP.md). Não há pagamento online. Carrinho e favoritos ficam no navegador; falhas de armazenamento não impedem o uso.

As alegações do mockup sobre entrega nacional, parcelamento em 12 vezes e mais de 20 anos não foram usadas porque não constam na fonte real. Categorias sem produtos oferecem consulta à equipe, sem inventar itens ou preços.

## Verificação

`npm test` verifica busca por acentos, categorias, integridade dos arquivos, cálculo em centavos, variantes e recuperação segura do carrinho. Validar também visualmente em desktop e celular antes de publicar alterações.

O carrinho prepara um PRÉ-PEDIDO com nome, forma de recebimento e bairro obrigatório para entrega. O cliente pode visualizar o texto antes de abrir o WhatsApp. Os dados de atendimento ficam apenas na memória da página, sem gravação no navegador ou servidor.

## Painel administrativo — integração preparada

Acesse `/admin/` pelo link separado. Sem configuração do Supabase, o painel fica bloqueado e mostra conexão pendente. A integração inclui login, autorização por perfil, rascunho na nuvem, upload de imagens, publicação pelo GitHub Actions e métricas de acesso. Só administradores cadastram usuários e publicam; editores alteram o catálogo. Categorias e lojas continuam somente para consulta. O botão Exportar baixa uma cópia e não publica. Consulte o guia de ativação; testes reais de Auth, RLS, Storage e deploy dependem de um projeto Supabase configurado.
