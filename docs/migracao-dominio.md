# Fase 7: migração do domínio (roteiro)

Anotado em 05/11/2026. Executar só quando o Gabriel pedir.

## Situação conferida em 04/11/2026

- DNS do domínio no Wix: `ns10.wixdns.net` e `ns11.wixdns.net`.
- Domínio sem www (`laranjeiraatelier.com.br`): registros A para o Wix (`185.230.63.186`, `.107`, `.171`).
- `www` com CNAME para `cdn3.wixdns.net`.
- **Nenhum registro MX nem TXT**: o domínio não tem e-mail próprio. O Gmail da Dilce (dillaranjeira@gmail.com) não é afetado.
- Sem DNSSEC (não precisa desligar nada antes da troca).
- Registro.br: domínio ativo, registrado em 22/05/2025, **vence em 22/05/2027**.
- Domínio canônico: **www.laranjeiraatelier.com.br**. O domínio sem www redireciona (301) para o com www.
- Site hoje: Worker `laranjeira-atelier`, em https://laranjeira-atelier.hub-villa-deli.workers.dev (conta Cloudflare `1078752fdb2ad1e73785039e4c3c958e`).

## Antes do dia (combinar com a Dilce)

1. A Dilce precisa entrar na conta do Registro.br de quem registrou o domínio (CPF ou login, senha e verificação em duas etapas, se houver). Ela faz o passo 2, sozinha ou numa chamada com o Gabriel.
2. Confirmar que ela não usa nenhum e-mail `@laranjeiraatelier.com.br` (pelo DNS, não existe nenhum).
3. Cancelar o plano do Wix só uma ou duas semanas depois de o site novo estar no ar. O domínio está no Registro.br, não no Wix.
4. Escolher um horário de pouco movimento: por algumas horas, parte dos visitantes ainda vê o Wix.

## No dia

### 1. Cloudflare (Gabriel)
1. https://dash.cloudflare.com → Add a domain → `laranjeiraatelier.com.br` → plano Free.
2. Nos registros importados, apagar os que apontam para o Wix: os A do domínio sem www (`185.230.63.x`) e o CNAME do `www` (`cdn3.wixdns.net`).
3. Anotar os 2 servidores DNS que o Cloudflare mostrar (`xxx.ns.cloudflare.com`, `yyy.ns.cloudflare.com`).

### 2. Registro.br (Dilce)
1. https://registro.br → Entrar.
2. Clicar no domínio `laranjeiraatelier.com.br`.
3. Na seção DNS → Alterar servidores DNS.
4. Trocar `ns10.wixdns.net` e `ns11.wixdns.net` pelos 2 servidores do Cloudflare → Salvar.
5. Vale em minutos no Registro.br; propagação completa em até 24 horas.

### 3. Esperar o Cloudflare ativar (Gabriel)
Chega um e-mail dizendo que o domínio está ativo (minutos a algumas horas).

### 4. Ligar o site ao domínio (Claude, pelo terminal, com o ok do Gabriel)
- Acrescentar ao `wrangler.jsonc`: `"routes": [{ "pattern": "www.laranjeiraatelier.com.br", "custom_domain": true }]` e publicar.
- O certificado HTTPS é emitido automaticamente.

### 5. Domínio sem www → www (Gabriel, no painel)
1. DNS → Records → Add record: tipo `AAAA`, nome `@`, endereço `100::`, Proxied ligado (endereço técnico só para o redirecionamento).
2. Rules → Redirect Rules → Create rule:
   - quando o hostname for igual a `laranjeiraatelier.com.br`;
   - redirecionamento dinâmico para `concat("https://www.laranjeiraatelier.com.br", http.request.uri.path)`;
   - código 301, mantendo a query string.

### 6. Site público para o Google (Claude, com o ok do Gabriel)
1. Criar a variável de build `SITE_PUBLICO = sim` (Workers & Pages → laranjeira-atelier → Settings → Build → Variables) e publicar. Tira o `noindex`; o `.workers.dev` continua com `noindex` pelo `public/_headers`.
2. Web Analytics (Gabriel): Analytics & Logs → Web Analytics → Add a site → `www.laranjeiraatelier.com.br`, configuração manual (JS snippet) → copiar o valor `token` → colar em `content/site.json`, campo `analyticsToken`.

### 7. Envio do formulário pelo Resend (Gabriel e Claude)
1. resend.com → Domains → Add Domain → `laranjeiraatelier.com.br`.
2. Copiar para o DNS do Cloudflare os registros que o Resend mostrar (TXT e MX de um subdomínio de envio) → Verify. Esse MX não afeta o Gmail.
3. Criar uma API Key só com permissão de envio. No PowerShell do Gabriel, na pasta do projeto:
   - `npx wrangler secret put RESEND_API_KEY`
   - `npx wrangler secret put CONTATO_DE` → `Site Laranjeira Atelier <site@laranjeiraatelier.com.br>`
   - `CONTATO_PARA` já está gravado (dillaranjeira@gmail.com).
4. Turnstile: conferir se `laranjeiraatelier.com.br` e `www.laranjeiraatelier.com.br` estão nos hostnames do widget.

### 8. Search Console (Gabriel)
1. Adicionar propriedade → Domínio → `laranjeiraatelier.com.br`.
2. Criar no DNS do Cloudflare o TXT `google-site-verification=…` → Verificar.
3. Sitemaps → enviar `https://www.laranjeiraatelier.com.br/sitemap.xml`.
4. Inspeção de URL → solicitar indexação da Início e de cada livro.

## Checklist final (Claude confere)

- HTTPS ativo em `www` e no domínio sem www (que redireciona para o www).
- Os 14 endereços antigos do Wix (`public/_redirects`) dando 301 no domínio real.
- Formulário enviando de verdade: teste até o Gmail da Dilce, e o "Responder" indo para quem escreveu.
- `/comprar/` e `/painel/` funcionando no domínio.
- `noindex` só no `.workers.dev`, não no domínio.
- Lighthouse de novo no domínio real.

## Depois

- Em 1–2 semanas: Search Console → relatório de páginas e erros de rastreamento.
- Só então cancelar o plano do Wix.
- Pendências que não dependem da migração: painel (`CF_ANALYTICS_TOKEN`, `PAINEL_SENHA`), wrangler 4.153.0 a partir de 09/11/2026.
