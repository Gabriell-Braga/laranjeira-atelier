# Laranjeira Atelier

Site de Dilce Laranjeira: ilustração, design gráfico e a coleção Sertão Vivo.
Next.js publicado na Vercel. As páginas são geradas no build (estáticas); só o formulário (`/api/contato`) roda no servidor.

## Rodar no computador

```sh
npm install
npm run dev       # desenvolvimento, com recarga automática: http://localhost:3000
npm run preview   # build de produção servido com next start, como na Vercel: http://localhost:3000
```

Outros comandos:

- `npm run build`: gera as imagens e o build de produção (é o que a Vercel roda).
- `npm run imagens`: gera as versões web das imagens em `public/img`. Só reprocessa o que mudou.
- `node scripts/baixa-resolucao.mjs`: atualiza a lista `content/imagens-baixa-resolucao.md`.
- `/componentes/`: página interna com todos os componentes (fora do menu).

## Conteúdo

Todo o texto fica em `content/`:

- `content/site.json`: contatos, links da Amazon e redes sociais.
- `content/livros/*.json`: um arquivo por livro.
- `content/portfolio/*.json`: trabalhos do portfólio.
- `content/paginas/*.md`: textos das páginas.
- `content/importacao.md`: relatório da importação do site antigo.

Marcadores `[PREENCHER: ...]` indicam conteúdo que ainda falta.

## Imagens originais (fora do git)

Os arquivos em alta resolução ficam em `content/originais/`. Essa pasta **não vai para o repositório**, porque só as versões geradas para a web (em `public/img`) são publicadas.

Guarde a pasta `content/originais` inteira no Google Drive da Dilce, por exemplo em `Laranjeira Atelier/Site/originais`. Para trabalhar em outro computador, baixe a pasta do Drive para `content/originais/`.

Depois de colocar ou trocar um original, rode `npm run imagens` e faça commit de `public/img`. O build da Vercel não tem os originais e usa as versões já geradas. Para remover do site as imagens cujo original foi apagado: `node scripts/imagens.mjs --limpar`.

Para trazer de novo as imagens do site antigo: `node scripts/importar-wix.mjs`. O script nunca sobrescreve um arquivo existente.

## Publicação (deploy)

O site está na **Vercel**, ligado ao repositório do GitHub.

- **Push na `main`**: a Vercel roda `npm run build` e atualiza a versão de produção (a prévia `.vercel.app`, e o domínio depois da migração).
- **Push em outra branch**: a Vercel gera uma prévia separada com endereço próprio, sem mexer na produção.
  O link aparece no GitHub (no commit ou no pull request) e no painel da Vercel, em Deployments.
- O Node 22 vem de `engines` no `package.json` (e do `.nvmrc` no computador).

### Indexação no Google
Enquanto a variável `SITE_PUBLICO` não for `sim`, o site inteiro sai com `noindex`
(meta nas páginas e cabeçalho `X-Robots-Tag`). Ela só será ligada na migração do domínio,
em Vercel > laranjeira-atelier > Settings > Environment Variables (ambiente Production), seguida de um novo deploy.
Os endereços `.vercel.app` continuam com `noindex` para sempre (regra em `next.config.ts`).
O interruptor fica num lugar só, `lib/publico.ts`, lido pelo layout e pelo `next.config.ts`.

### Formulário de contato
`/api/contato` é uma função da Vercel (`app/api/contato/route.ts`). Ela valida os campos (`lib/contato.ts`;
teste: `node lib/contato.ts`), confere o Turnstile, ignora robôs pelo campo escondido e envia pelo Resend.

Variáveis de ambiente (Vercel > Settings > Environment Variables; no computador, em `.env.local`, que fica fora do git):

| Nome | O que é |
|---|---|
| `TURNSTILE_SITE_KEY` | chave pública do widget Turnstile (Cloudflare Turnstile funciona em qualquer hospedagem) |
| `TURNSTILE_SECRET` | chave secreta do Turnstile |
| `RESEND_API_KEY` | chave da API do Resend |
| `CONTATO_PARA` | e-mail da Dilce que recebe as mensagens |
| `CONTATO_DE` | remetente no domínio verificado, ex.: `Site Laranjeira Atelier <site@laranjeiraatelier.com.br>` |

Sem `RESEND_API_KEY`, `CONTATO_PARA` ou `CONTATO_DE`, o formulário fica em **modo de teste**: valida tudo, não envia e avisa na tela.
No Turnstile, o widget precisa listar os domínios onde aparece (o `.vercel.app` e, depois, `www.laranjeiraatelier.com.br`).

Testar no computador: copie `.env.example` para `.env.local` (já vem com as chaves de teste do Turnstile) e rode `npm run dev`.

## Portfólio

A lista oficial de trabalhos é a planilha **`content/portfolio.csv`** (pode ser editada no Google Sheets e exportada como CSV).
As séries (título, tipo, se têm página própria) ficam em `content/portfolio/series.json`.
O modelo com 3 linhas de exemplo é `content/portfolio-modelo.csv`.

Colunas: `arquivo, titulo, serie, tipo, tecnica, ano, ano_fonte, cliente_ou_livro, nome_cientifico, descricao, destaque, alt`.

- `arquivo`: caminho a partir de `content/originais/` (ex.: `portfolio/aves/sabia.jpg`).
- `tipo`: `ilustracao`, `design-grafico` ou `livros-autorais` (vazio = tipo da série).
- `tecnica`: `aquarela`, `grafite`, `pastel`, `digital`, `gravura`; várias separadas por `;`. No filtro, grafite e pastel aparecem como "Desenho".
- `ano` e `ano_fonte`: só anos confirmados, dizendo de onde vieram (ex.: `currículo`). Nunca estimar.
- `destaque`: `sim` coloca o item no começo da ordem padrão.
- `alt`: descrição da imagem para quem não enxerga. **Item sem alt não entra no site.**

Trabalhos novos:
1. Coloque as imagens em `content/originais/portfolio/<serie>/`.
2. Rode `npm run portfolio`. Imagens sem linha vão para `content/portfolio-novas-linhas.csv`, já com arquivo e série.
3. Copie essas linhas para a planilha, preencha, exporte como CSV por cima de `content/portfolio.csv`.
4. Rode `npm run portfolio` de novo até não sobrar problema grave e faça commit de `content/portfolio.csv` e `public/img`.

Séries com `"pagina": true` aparecem na grade como um cartão de projeto e ganham a página `/portfolio/<serie>/`.
O build gera `/portfolio/indice.json` (metadados de todos os itens), que o navegador só baixa quando a pessoa rola, filtra ou abre o lightbox.

## Medição (sem cookies)

- **Vercel Web Analytics**: visitas por página, sem cookies. Ligar uma vez em Vercel > laranjeira-atelier > Analytics > Enable.
  Os números aparecem nessa mesma aba.
- No plano grátis da Vercel não há contagem de eventos, então os cliques em "Comprar na Amazon" não são contados.

## SEO

- Metadados, endereço canônico e imagem de compartilhamento por página (`lib/meta.tsx`); imagens em `/og/`, geradas no build (`scripts/og.mjs`).
- JSON-LD: WebSite e Person (Início e Sobre), Book em cada livro e BookSeries na coleção (`lib/dados-estruturados.ts`).
- `/sitemap.xml` e `/robots.txt` gerados no build. Título e descrição de cada livro para o Google: `seoTitulo` e `seoDescricao` em `content/livros/*.json`.
- Redirecionamentos dos endereços do Wix (permanentes): `next.config.ts`.
