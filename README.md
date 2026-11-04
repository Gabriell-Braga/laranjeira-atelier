# Laranjeira Atelier

Site de Dilce Laranjeira: ilustração, design gráfico e a coleção Sertão Vivo.
Next.js com exportação estática, publicado no Cloudflare (Worker com arquivos estáticos).

## Rodar no computador

```sh
npm install
npm run dev       # desenvolvimento, com recarga automática: http://localhost:3000
npm run preview   # gera o site estático (out/) e serve como ficará publicado: http://localhost:3000
```

Com `output: "export"`, o `next start` não serve o site; para ver a versão final use `npm run preview`.

Outros comandos:

- `npm run build`: gera as imagens e o site estático em `out/` (é o que o Cloudflare roda).
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

Depois de colocar ou trocar um original, rode `npm run imagens` e faça commit de `public/img`. O build do Cloudflare não tem os originais e usa as versões já geradas. Para remover do site as imagens cujo original foi apagado: `node scripts/imagens.mjs --limpar`.

Para trazer de novo as imagens do site antigo: `node scripts/importar-wix.mjs`. O script nunca sobrescreve um arquivo existente.

## Publicação (deploy)

O site é um **Worker do Cloudflare com arquivos estáticos**, ligado ao repositório do GitHub (Workers Builds).
A configuração fica em `wrangler.jsonc`: publica a pasta `out/`, usa `out/404.html` para páginas inexistentes e põe barra no fim das URLs.

- **Push na `main`**: o Cloudflare roda `npm run build` e `npx wrangler deploy` e atualiza
  https://laranjeira-atelier.hub-villa-deli.workers.dev (leva cerca de 1 minuto).
- **Push em outra branch**: o Cloudflare gera uma prévia separada, sem mexer na versão principal:
  `https://<branch>-laranjeira-atelier.hub-villa-deli.workers.dev`.
  ```sh
  git switch -c previa-dilce
  # ... alterações e commits ...
  git push -u origin previa-dilce
  ```
  Se a prévia não aparecer, confira no painel: Workers & Pages > laranjeira-atelier > Settings > Build >
  "Builds for non-production branches" deve estar ligado.
- **Publicar pelo terminal** (sem esperar o GitHub): `npm run build` e depois `npx wrangler deploy`.
  Precisa de `npx wrangler login` uma vez nesta máquina.
- **Ver deploys:** `npx wrangler deployments list`.

### Indexação no Google
Enquanto a variável `SITE_PUBLICO` não for `sim`, o site inteiro sai com `noindex`
(meta nas páginas e cabeçalho `X-Robots-Tag` em todos os arquivos). Ela só será ligada na migração do domínio,
em Workers & Pages > laranjeira-atelier > Settings > Build > Variables and secrets.
O endereço `.workers.dev` continua com `noindex` para sempre (regra em `public/_headers`).

### Formulário de contato (Worker)
O site é estático, mas `/api/contato` passa pelo código em `worker/index.ts` (ver `run_worker_first` em `wrangler.jsonc`).
Ele valida os campos (`worker/contato.ts`; teste: `node worker/contato.ts`), confere o Turnstile, ignora robôs pelo
campo escondido e envia pelo Resend.

Segredos do Worker (cada um com `npx wrangler secret put NOME`; o valor é digitado no terminal e não fica em arquivo):

| Nome | O que é |
|---|---|
| `TURNSTILE_SITE_KEY` | chave pública do widget Turnstile |
| `TURNSTILE_SECRET` | chave secreta do Turnstile |
| `RESEND_API_KEY` | chave da API do Resend |
| `CONTATO_PARA` | e-mail da Dilce que recebe as mensagens |
| `CONTATO_DE` | remetente no domínio verificado, ex.: `Site Laranjeira Atelier <site@laranjeiraatelier.com.br>` |

Sem `RESEND_API_KEY`, `CONTATO_PARA` ou `CONTATO_DE`, o formulário fica em **modo de teste**: valida tudo, não envia e avisa na tela.

Testar no computador: copie `.dev.vars.example` para `.dev.vars` (chaves de teste do Turnstile) e rode `npm run dev:worker`
(site e formulário em http://127.0.0.1:8787). O Node 22 vem do `.nvmrc`.

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

## Pendências com data

- **A partir de 09/11/2026:** atualizar o `wrangler` de 4.151.3 para **4.153.0** (aprovado). Essa versão resolve os 3 alertas do
  `npm audit` (undici, via miniflare), que afetam só a ferramenta de deploy, não o site publicado. Ela só completa
  duas semanas de publicada nessa data. Comando: `npm install -D wrangler@4.153.0`, depois `npm audit` deve dar 0.
