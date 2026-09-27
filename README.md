# Droga Vida Popular

Site responsivo baseado no mockup fornecido. Catálogo com 41 produtos, imagens, preços, tamanhos, busca, categorias, favoritos e carrinho. O cliente revisa o pedido e conclui o atendimento pelo WhatsApp da loja.

## Executar

Requer Node.js 20 ou superior. Sem dependências de instalação.

```sh
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

O catálogo é uma fotografia dos dados na data de importação: não existe sincronização automática de estoque ou preços. Atualize `catalog.json` e as imagens para alterações futuras. Preços e disponibilidade são confirmados pela equipe no WhatsApp. Não há login, pagamento online, envio de e-mail, painel administrativo ou armazenamento de dados de clientes no servidor. Carrinho e favoritos ficam no navegador; falhas de armazenamento não impedem o uso.

As alegações do mockup sobre entrega nacional, parcelamento em 12 vezes e mais de 20 anos não foram usadas porque não constam na fonte real. Categorias sem produtos oferecem consulta à equipe, sem inventar itens ou preços.

## Verificação

`npm test` verifica busca por acentos, categorias, integridade dos arquivos, cálculo em centavos, variantes e recuperação segura do carrinho. Validar também visualmente em desktop e celular antes de publicar alterações.

O carrinho prepara um PRÉ-PEDIDO com nome, forma de recebimento e bairro obrigatório para entrega. O cliente pode visualizar o texto antes de abrir o WhatsApp. Os dados de atendimento ficam apenas na memória da página, sem gravação no navegador ou servidor.

## Painel administrativo — primeira etapa

Acesse /admin/ para visualizar indicadores e editar o catálogo como rascunho local. Inclui busca, filtros, cadastro e edição de produtos, preços, tamanhos, estoque, destaques, disponibilidade por loja e exportação de catalog.json. Categorias e lojas são consultadas, sem edição nesta etapa. O painel não possui autenticação nem conexão de escrita com o site público: os rascunhos ficam somente no navegador. Não inserir dados privados. Autenticação, banco de dados, publicação e reforço de segurança ficam para a integração futura. O painel de referência exigiu login; telas internas ainda não foram comparadas.
