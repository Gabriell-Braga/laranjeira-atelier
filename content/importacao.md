# Relatório de importação do site atual (Wix)

Data da importação: 04/11/2026. Script: `node scripts/importar-wix.mjs`.

## De onde veio

O sitemap do site atual (`/sitemap.xml` → `/pages-sitemap.xml`) lista 7 páginas. O menu tem as mesmas 7. O script lê o JSON interno de cada página do Wix (o mesmo que o navegador usa para montar as galerias), então pegamos **todas** as imagens das galerias, com título e descrição, e não só as que aparecem na primeira tela.

| Página antiga | Textos | Imagens | Para onde foi |
|---|---|---|---|
| Home `/` | nenhum texto (só o slideshow) | 19 (slideshow, sem título nem alt) | `wix/home/` |
| Design Gráfico `/design-grafico` | nenhum texto | 31 (30 na galeria + 1 de destaque) | `wix/design-grafico/` |
| Ilustração `/ilustracao` | nenhum texto | 61 (60 na galeria + 1 de destaque) | `wix/ilustracao/` |
| Sobre `/sobre` | apresentação em 4 parágrafos + link "Breve currículo" (PDF) | 1 (Tesourinha) + PDF do currículo | `content/paginas/sobre.md`, `wix/sobre/` |
| Projeto Sertão Vivo `/projeto-sertão-vivo` | texto completo, objetivos, lista de volumes, ficha | 10 (vinheta, montagens de capa/miolo e de pranchas) | `content/paginas/projeto.md`, `content/livros/*.json`, `wix/projeto-sertao-vivo/` |
| Livros Sertão Vivo `/coleção-sertão-vivo` | chamadas dos livros 1 e 2, texto da coleção | 11 (4 capas, 4 páginas de rosto, caixa, cartaz, capas lado a lado) | `content/paginas/livros.md`, `content/livros/*.json`, `wix/colecao-sertao-vivo/` |
| Contato `/contato` | nenhum texto além do e-mail | 2 (Bogari, imagem com o e-mail) | `content/site.json`, `wix/contato/` |

Também extraímos as descrições (meta description) que a Dilce escreveu no Wix para Home, Design Gráfico, Ilustração, Projeto e Contato. Elas estão no campo `descricao` das páginas em `content/paginas/`.

O currículo em PDF (2 páginas) trouxe: formação, trajetória, editoras, exposições e a lista de publicações. Usei a formação e a trajetória em `sobre.md` e as exposições em `agenda.md`, com as palavras do PDF. A lista de publicações do PDF também confirma autor, editora e ano de vários projetos do portfólio.

## Links encontrados

- E-mail: dillaranjeira@gmail.com (página Contato e currículo).
- Telefone: (31) 99415 2043 (só no currículo em PDF).
- Amazon, um link por oferta (página Livros Sertão Vivo). Já estão em `content/site.json`:
  - Livro I, Ave, Sertão!: https://www.amazon.com.br/dp/6501834376
  - Livro II, Vive, Sertão!: https://www.amazon.com.br/dp/6501834392
  - Livro III, Mbur’iti, Sertão!: https://www.amazon.com.br/dp/650184195X
  - Livro IV, Sertão Sem Fim!: https://www.amazon.com.br/dp/6501834384
  - Coleção completa: https://www.amazon.com.br/dp/6502162339

## Imagens

- 135 imagens e 1 PDF, 140 MB no total, em `content/originais/wix/<página>/`. Fora do git.
- Todas vieram no tamanho original enviado ao Wix (conferido arquivo por arquivo com o sharp).
- **Atenção à resolução.** Muitas imagens foram enviadas pequenas ao Wix. O pipeline nunca amplia: uma imagem de 800px gera só a versão de 480px e a de 800px.

| Largura do original | Quantidade |
|---|---|
| menor que 960px | 51 |
| de 960 a 1599px | 58 |
| de 1600 a 2399px | 12 |
| 2400px ou mais | 14 |

Para as aquarelas brilharem no lightbox, o ideal é a Dilce mandar os arquivos em alta resolução das ilustrações principais (ao menos 2400px no lado maior). Basta colocar o arquivo com **o mesmo nome** no mesmo lugar em `content/originais/wix/...`. O importador nunca sobrescreve um arquivo existente, então a versão dela prevalece.

## O que não foi possível importar

- **Logo em vetor.** O Wix só tem um PNG de 343×106px, pequeno para telas de alta densidade. Precisamos do arquivo original (SVG, AI ou PDF).
- **Instagram.** Não aparece em nenhuma página.
- **WhatsApp.** Não aparece no site. O telefone do currículo pode ser o WhatsApp, mas isso precisa de confirmação.
- **Páginas internas dos livros, uma a uma.** O site só tem montagens (capa + miolo, várias pranchas juntas). A galeria de cada livro precisa das páginas e pranchas individuais.
- **Descrições oficiais dos livros III e IV** e ISBNs dos livros II, III, IV e da coleção.
- **Nome científico e técnica de cada ilustração.** O Wix tem só título e uma descrição curta (por exemplo, "Ilustração editorial-Aquarela"). Onde a técnica aparece, ela está no catálogo abaixo.
- **Títulos e alt do slideshow da Home.** As 19 imagens não têm texto nenhum.
- **Foto da Dilce.** Não existe no site atual.

## URLs antigas e redirecionamentos (proposta, ainda não aplicada)

| URL antiga | Nova | Observação |
|---|---|---|
| `/` | `/` | |
| `/design-grafico` | `/portfolio/?tipo=design-grafico` | |
| `/ilustracao` | `/portfolio/?tipo=ilustracao` | |
| `/sobre` | `/sobre/` | |
| `/contato` | `/contato/` | |
| `/projeto-sertão-vivo` | `/projeto/` | No `_redirects` vai codificada: `/projeto-sert%C3%A3o-vivo` |
| `/coleção-sertão-vivo` | `/livros/` | No `_redirects` vai codificada: `/cole%C3%A7%C3%A3o-sert%C3%A3o-vivo` |

Na Fase 6 também vou cobrir a variante sem acento (`/projeto-sertao-vivo`, `/colecao-sertao-vivo`) por segurança.

## Séries propostas para o portfólio (confirmar)

Montadas a partir dos títulos e descrições do Wix e da lista de publicações do currículo:

**Ilustração**
- Aves: Saíra Azul, Acauã, Fogo-apagou, Quero-quero (Ave, Sertão!), Bico-de-lacre, Spizella, Tapaculo-de-colarinho, Tesourinha.
- Flora e culinária: Pequi (Mbur’iti), Lágrima de Cristo, Pimenta dedo de moça, Amora e Tamarindo (Aquarela e Sabores).
- Cartazes Ecológicos Petrobras: 5 pranchas de fauna e flora, incluindo Epidendrum.
- Retratos: 5 retratos (pastel, aquarela, grafite), Girl, Pele, Poema.
- Povos indígenas, livro Nosso Nome: Menino Maxakali, Menina Pataxó, Adereços Pataxó, Cocar Xucuru-Kariri.
- Arquitetura e cidade: Metrô, Chuva, Cartas (livro Reversos), Paisagens urbanas, Casa de fazenda, Cachoeira.
- Livros infantis: Dibi (7 imagens), A caixa de sonhos (3), Chuva de Natal, Aldeia, A minha floresta, Um livro voador, A Magia das Cores, Natureza, Estudo bebê, Estudos em aquarela.
- Didáticos de Ciências: Alimentos, Estrutura de casa, Ilustrações.
- Avulsas: Bichos, Pisce, Passagem, Catálogo Editorial (capa).

**Design gráfico (cada um vira um projeto com página própria)**
Aquarela & Sabores · A Minha Floresta · Cadernos de Ilustração Científica: Aquarela · Reversos · Livro Ilustrado da Zoobotânica · Preservando os Raros Faveiros · Guia Gravura em Metal · Poetando · Pedro Nava, Leitor de Drummond · A Guerra do Cachoeirão · Será que foi Sequestro? · Sketchbooks · A Magia das Cores · Chuva de Natal · Memento 2020 · Projeto Nosso Nome · Um Livro Voador.

**Livros autorais:** os 4 volumes da coleção Sertão Vivo.

Dúvida: o Wix cita a técnica **pastel** em dois retratos, mas os filtros pedidos são Aquarela, Grafite, Digital e Gravura. Incluo Pastel como filtro?

## Catálogo completo

O catálogo de cada imagem (arquivo, dimensões, título e descrição do Wix, se estava em galeria) está em `content/importacao/wix.json`.
