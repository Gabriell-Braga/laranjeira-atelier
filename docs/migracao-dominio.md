# Fase 7: migração do domínio (roteiro)

Atualizado em 05/11/2026: hospedagem na **Vercel** e DNS no **Registro.br** (decisão do Gabriel).
Executar só quando o Gabriel pedir.

## Situação conferida em 04/11/2026

- DNS do domínio no Wix: `ns10.wixdns.net` e `ns11.wixdns.net`.
- Domínio sem www (`laranjeiraatelier.com.br`): registros A para o Wix (`185.230.63.186`, `.107`, `.171`).
- `www` com CNAME para `cdn3.wixdns.net`.
- **Nenhum registro MX nem TXT**: o domínio não tem e-mail próprio. O Gmail da Dilce (dillaranjeira@gmail.com) não é afetado.
- Sem DNSSEC (não precisa desligar nada antes da troca).
- Registro.br: domínio ativo, registrado em 22/05/2025, **vence em 22/05/2027**.
- Domínio canônico: **www.laranjeiraatelier.com.br**. O domínio sem www redireciona para o com www.

## Como fica

- **Registro do domínio:** continua da Dilce, no Registro.br.
- **DNS:** sai do Wix e passa para o DNS do próprio Registro.br (grátis). A Dilce (ou o Gabriel, com acesso dela) cria os registros lá.
- **Site:** projeto `laranjeira-atelier` na Vercel do Gabriel.

## Antes do dia (combinar com a Dilce)

1. A Dilce precisa entrar na conta do Registro.br de quem registrou o domínio (CPF ou login, senha e verificação em duas etapas, se houver). Ela faz o passo 2, sozinha ou numa chamada com o Gabriel.
2. Confirmar que ela não usa nenhum e-mail `@laranjeiraatelier.com.br` (pelo DNS, não existe nenhum).
3. Cancelar o plano do Wix só uma ou duas semanas depois de o site novo estar no ar. O domínio está no Registro.br, não no Wix.
4. Escolher um horário de pouco movimento: por algumas horas, parte dos visitantes ainda vê o Wix.

## No dia

### 1. Vercel: adicionar os domínios (Gabriel)
1. Vercel → laranjeira-atelier → Settings → Domains → Add → `www.laranjeiraatelier.com.br`.
2. Add de novo → `laranjeiraatelier.com.br`, escolhendo **redirecionar para** `www.laranjeiraatelier.com.br` (308).
3. Anotar os registros que a Vercel pedir para cada um (normalmente um **A** para o domínio sem www e um **CNAME** para o `www`). Usar sempre os valores que aparecem na tela, não os de exemplo.

### 2. Registro.br: trocar o DNS do Wix pelo do Registro.br (Dilce)
1. https://registro.br → Entrar → clicar no domínio `laranjeiraatelier.com.br`.
2. Seção DNS → **Alterar servidores DNS** → escolher **Utilizar os servidores DNS do Registro.br** → Salvar.
3. Ainda na seção DNS → **Configurar zona DNS** (ou "Editar zona") → Nova entrada:
   - tipo **A**, nome vazio (o próprio domínio), valor = o IP que a Vercel mostrou;
   - tipo **CNAME**, nome `www`, valor = o endereço que a Vercel mostrou.
4. Salvar. Vale em minutos; propagação completa em até 24 horas.

### 3. Esperar a Vercel validar (Gabriel)
Em Settings → Domains, os dois domínios ficam com "Valid Configuration". O certificado HTTPS é emitido sozinho.

### 4. Site público para o Google (Claude, com o ok do Gabriel)
1. Vercel → Settings → Environment Variables → `SITE_PUBLICO` = `sim`, **só no ambiente Production** → Redeploy.
   Tira o `noindex` do domínio; os endereços `.vercel.app` continuam com `noindex` (`next.config.ts`).
2. Vercel → Analytics → Enable (se ainda não estiver ligado).

### 5. Envio do formulário pelo Resend (Gabriel e Claude)
1. resend.com → Domains → Add Domain → `laranjeiraatelier.com.br`.
2. Copiar para a zona DNS do Registro.br os registros que o Resend mostrar (TXT e MX de um subdomínio de envio) → Verify. Esse MX não afeta o Gmail.
3. Criar uma API Key só com permissão de envio. Na Vercel → Settings → Environment Variables (Production):
   - `RESEND_API_KEY` = a chave
   - `CONTATO_DE` = `Site Laranjeira Atelier <site@laranjeiraatelier.com.br>`
   - `CONTATO_PARA` = `dillaranjeira@gmail.com`
   - Redeploy.
4. Turnstile (dash.cloudflare.com → Turnstile): conferir se `laranjeiraatelier.com.br` e `www.laranjeiraatelier.com.br` estão nos hostnames do widget.

### 6. Search Console (Gabriel)
1. Adicionar propriedade → Domínio → `laranjeiraatelier.com.br`.
2. Criar na zona DNS do Registro.br o TXT `google-site-verification=…` → Verificar.
3. Sitemaps → enviar `https://www.laranjeiraatelier.com.br/sitemap.xml`.
4. Inspeção de URL → solicitar indexação da Início e de cada livro.

## Checklist final (Claude confere)

- HTTPS ativo em `www` e no domínio sem www (que redireciona para o www).
- Os endereços antigos do Wix (`next.config.ts`) redirecionando no domínio real.
- Formulário enviando de verdade: teste até o Gmail da Dilce, e o "Responder" indo para quem escreveu.
- `noindex` só no `.vercel.app`, não no domínio.
- Lighthouse de novo no domínio real.

## Depois

- Em 1–2 semanas: Search Console → relatório de páginas e erros de rastreamento.
- Só então cancelar o plano do Wix.
