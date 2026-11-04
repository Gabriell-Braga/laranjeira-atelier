# Laranjeira Atelier

Site de Dilce Laranjeira: ilustração, design gráfico e a coleção Sertão Vivo.
Next.js com exportação estática, hospedado no Cloudflare Pages.

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
