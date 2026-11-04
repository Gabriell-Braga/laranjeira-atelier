# Laranjeira Atelier

Site de Dilce Laranjeira: ilustração, design gráfico e a coleção Sertão Vivo.
Next.js com exportação estática, hospedado no Cloudflare Pages.

## Rodar no computador

```sh
npm install
npm run dev      # http://localhost:3000
npm run build    # gera o site estático em out/
npm start        # serve a pasta out/ como o site publicado
```

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

Para trazer de novo as imagens do site antigo: `node scripts/importar-wix.mjs`. O script nunca sobrescreve um arquivo existente.
