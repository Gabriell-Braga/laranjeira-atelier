// Lista as imagens usadas no site com menos de 1600px de largura, das mais importantes
// (topo das páginas, livros) para as menos (portfólio), e gera:
//   content/imagens-baixa-resolucao.md   lista técnica (para nós)
//   content/imagens-para-substituir.html folha para a Dilce, com miniaturas embutidas (funciona offline)
//   content/imagens-para-substituir.pdf  a mesma folha em PDF, se o Google Chrome estiver instalado
// Uso: node scripts/baixa-resolucao.mjs
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import matter from "gray-matter";
import sharp from "sharp";

const RAIZ = path.resolve(import.meta.dirname, "..");
const MINIMO = 1600;
const IDEAL = 2400;

// "Urgente" = fica visivelmente ruim no site. Telas comuns: computador Full HD (1920×1080, 1x)
// e celular de 390 pontos com densidade 2x. Espaço máximo (largura × altura, em pixels físicos)
// que a imagem ocupa em cada uso:
const ESPACOS = {
  // lightbox: área livre no Full HD (~1880×860) e no celular (390×560 pontos = 780×1120 pixels)
  lightbox: [[1880, 860], [780, 1120]],
  // topo de página: meia coluna no computador (~600px) e largura toda no celular (350 pontos = 700px)
  topo: [[600, Infinity], [700, Infinity]],
};
const TOLERANCIA = 0.75; // abaixo de 75% do necessário, a ampliação já aparece (imagem pequena ou borrada)
const larguraExibida = (w, h, [bw, bh]) => Math.min(bw, (bh * w) / h);
const manifesto = JSON.parse(readFileSync(path.join(RAIZ, "public/img/manifest.json"), "utf8"));
const json = (rel) => JSON.parse(readFileSync(path.join(RAIZ, "content", rel), "utf8"));
const lista = (pasta) => readdirSync(path.join(RAIZ, "content", pasta)).filter((f) => f.endsWith(".json")).map((f) => json(`${pasta}/${f}`));

// Página do Wix de onde veio cada arquivo (relatório da importação)
const paginaWix = new Map();
for (const p of json("importacao/wix.json")) {
  for (const i of p.imagens) paginaWix.set(i.arquivo, [...(paginaWix.get(i.arquivo) ?? []), p.titulo]);
}

// [arquivo, nome provável da obra, onde aparece no site novo]
const usos = [];
for (const f of readdirSync(path.join(RAIZ, "content/paginas"))) {
  const { data } = matter(readFileSync(path.join(RAIZ, "content/paginas", f), "utf8"));
  const pagina = f === "inicio.md" ? "Início" : data.titulo;
  if (data.imagemDestaque in manifesto) usos.push([data.imagemDestaque, (data.imagemDestaqueAlt ?? "Imagem do topo").split(",")[0], `Topo da página ${pagina}`, "topo"]);
}
for (const l of lista("livros").sort((a, b) => a.ordem - b.ordem)) {
  usos.push([l.capa.arquivo, `Capa de ${l.titulo}`, `Livro ${l.titulo}: capa`, "lightbox"]);
  for (const i of l.imagens) usos.push([i.arquivo, `${l.titulo}: ${i.titulo ?? "imagem"}`, `Livro ${l.titulo}: galeria`, "lightbox"]);
}
for (const s of lista("portfolio").sort((a, b) => a.ordem - b.ordem)) {
  for (const i of s.itens) usos.push([i.arquivo, i.titulo ?? i.alt, `Portfólio, série ${s.titulo}`, "lightbox"]);
}

const porArquivo = new Map();
for (const [arquivo, nome, onde, espaco] of usos) {
  const atual = porArquivo.get(arquivo) ?? { arquivo, nome, onde: [], espacos: new Set() };
  atual.onde.push(onde);
  atual.espacos.add(espaco);
  porArquivo.set(arquivo, atual);
}
const itens = [...porArquivo.values()]
  .filter((i) => manifesto[i.arquivo].largura < MINIMO)
  .map((i, n) => {
    const { largura: w, altura: h } = manifesto[i.arquivo];
    const fator = IDEAL / Math.max(w, h);
    const num = String(n + 1).padStart(2, "0");
    const slug = i.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40).replace(/-$/, "");
    const necessaria = Math.round(Math.max(...[...i.espacos].flatMap((e) => ESPACOS[e]).map((caixa) => larguraExibida(w, h, caixa))));
    return { ...i, num, w, h, necessaria, urgente: w < TOLERANCIA * necessaria, ideal: `${Math.round(w * fator)} × ${Math.round(h * fator)}`, sugestao: `${num}-${slug}.jpg`, wix: paginaWix.get(i.arquivo) ?? ["(não veio do Wix)"] };
  });

// ---------- Markdown (para nós) ----------
writeFileSync(
  path.join(RAIZ, "content/imagens-baixa-resolucao.md"),
  `# Imagens em baixa resolução

Imagens usadas no site com menos de ${MINIMO}px de largura, em ordem de importância (topo das páginas e livros primeiro).
O número (#) é o mesmo da folha \`imagens-para-substituir.html\` enviada para a Dilce.

Como substituir: salve o arquivo novo com **o mesmo nome** do arquivo antigo, em \`content/originais/\` (caminho abaixo), e rode \`npm run imagens\`.

Total: ${itens.length} de ${porArquivo.size} imagens usadas. **Urgente: ${itens.filter((i) => i.urgente).length}**, se tiver: ${itens.filter((i) => !i.urgente).length}.

**Urgente** = na maior exibição real (topo de página ou lightbox) a imagem fica abaixo de ${TOLERANCIA * 100}% da largura necessária para telas comuns (computador Full HD 1x e celular 2x): aparece pequena ou borrada.
**Se tiver** = já aparece bem; um arquivo maior só melhoraria o zoom.

| # | Prioridade | Arquivo | Onde aparece | Tamanho atual | Largura necessária |
|---|---|---|---|---|---|
${itens.map((i) => `| ${i.num} | ${i.urgente ? "**Urgente**" : "Se tiver"} | \`${i.arquivo}\` | ${i.onde.join("<br>")} | ${i.w} × ${i.h} px | ${i.necessaria} px |`).join("\n")}
`,
);

// ---------- Folha HTML (para a Dilce) ----------
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function miniatura(arquivo) {
  const original = path.join(RAIZ, "content/originais", arquivo);
  const fonte = existsSync(original) ? original : path.join(RAIZ, "public/img", arquivo.replace(/\.[^.]+$/, "") + `-${manifesto[arquivo].larguras[0]}.webp`);
  const buf = await sharp(fonte).rotate().flatten({ background: "#ffffff" }).resize({ width: 320, height: 320, fit: "inside" }).jpeg({ quality: 72 }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

const cartoes = { urgente: [], seTiver: [] };
for (const i of itens) {
  cartoes[i.urgente ? "urgente" : "seTiver"].push(`<article class="cartao">
  <div class="mini"><img src="${await miniatura(i.arquivo)}" alt=""></div>
  <div class="dados">
    <p class="num">${i.num}</p>
    <h2>${esc(i.nome)}</h2>
    <dl>
      <dt>Estava no site antigo em</dt><dd>${esc(i.wix.join(", "))}</dd>
      <dt>Aparece no site novo em</dt><dd>${esc(i.onde.join("; "))}</dd>
      <dt>Tamanho atual</dt><dd>${i.w} × ${i.h} px</dd>
      <dt>Tamanho ideal</dt><dd>${i.ideal} px (${IDEAL}px no lado maior) ou maior</dd>
      <dt>Nome sugerido</dt><dd class="arq">${esc(i.sugestao)}</dd>
    </dl>
  </div>
</article>`);
}

const hoje = new Date().toLocaleDateString("pt-BR");
const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Imagens para substituir · Laranjeira Atelier</title>
<style>
  :root { --paper:#F7F4EE; --ink:#2A2620; --muted:#5E574C; --terra:#6B4A1E; --linha:#E4DDD0; --laranja:#ED7F29; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--paper); color: var(--ink); font: 17px/1.55 Georgia, "Times New Roman", serif; }
  main { max-width: 980px; margin: 0 auto; padding: 32px 20px 64px; }
  header { border-bottom: 3px solid var(--laranja); padding-bottom: 20px; margin-bottom: 28px; }
  h1 { font-size: 34px; line-height: 1.15; margin: 0 0 12px; font-weight: normal; }
  .aviso { font-size: 19px; margin: 0 0 10px; }
  .meta { color: var(--muted); font: 15px/1.5 Arial, sans-serif; margin: 0; }
  .grade { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .cartao { display: flex; gap: 14px; background: #fff; border: 1px solid var(--linha); border-radius: 6px; padding: 12px; break-inside: avoid; page-break-inside: avoid; }
  .mini { flex: 0 0 140px; height: 140px; display: flex; align-items: center; justify-content: center; background: var(--paper); border-radius: 4px; }
  .mini img { max-width: 140px; max-height: 140px; border-radius: 4px; }
  .num { font: bold 26px/1 Arial, sans-serif; color: var(--terra); margin: 0 0 4px; }
  h2 { font-size: 18px; line-height: 1.25; margin: 0 0 6px; font-weight: bold; }
  dl { margin: 0; font: 13px/1.4 Arial, sans-serif; color: var(--muted); }
  dt { font-weight: bold; color: var(--ink); margin-top: 3px; }
  dd { margin: 0; }
  .parte { font-size: 26px; font-weight: normal; margin: 36px 0 4px; border-bottom: 1px solid var(--linha); padding-bottom: 6px; }
  section:first-of-type .parte { margin-top: 0; }
  .explica { color: var(--muted); font: 15px/1.5 Arial, sans-serif; margin: 0 0 14px; }
  section + section { break-before: page; }
  .arq { font-family: Consolas, monospace; color: var(--ink); }
  @media (max-width: 640px) { .grade { grid-template-columns: 1fr; } }
  @media print {
    @page { size: A4; margin: 12mm; }
    body { background: #fff; font-size: 14px; }
    main { padding: 0; max-width: none; }
    .cartao { border-color: #ccc; padding: 8px; gap: 10px; }
    .mini { flex-basis: 100px; height: 100px; }
    .mini img { max-width: 100px; max-height: 100px; }
    h2 { font-size: 14px; }
    .num { font-size: 20px; }
    dl { font-size: 10.5px; }
    .grade { gap: 8px; }
  }
</style>
</head>
<body>
<main>
<header>
  <h1>Imagens para substituir</h1>
  <p class="aviso">Estas imagens estão pequenas para o zoom do site novo. Se você tiver o arquivo original de alguma delas, mande com o número no nome do arquivo (por exemplo, 07-saira-azul.jpg).</p>
  <p class="meta">${itens.length} imagens em duas partes: primeiro as urgentes, depois as que só melhorariam o zoom. Em cada parte, topo das páginas e livros vêm antes do portfólio. Tamanho ideal: ${IDEAL} pixels no lado maior, ou mais. Pode mandar JPG, PNG ou TIFF. Laranjeira Atelier, ${hoje}.</p>
</header>
<section>
  <h2 class="parte">Urgente: ${cartoes.urgente.length} imagens</h2>
  <p class="explica">Estas aparecem pequenas ou borradas no site, principalmente no celular e na tela cheia. São as que mais fazem diferença.</p>
  <div class="grade">
${cartoes.urgente.join("\n")}
  </div>
</section>
<section>
  <h2 class="parte">Se tiver: ${cartoes.seTiver.length} imagens</h2>
  <p class="explica">Estas já aparecem bem. Um arquivo maior só deixaria o zoom mais nítido.</p>
  <div class="grade">
${cartoes.seTiver.join("\n")}
  </div>
</section>
</main>
</body>
</html>
`;
const arquivoHtml = path.join(RAIZ, "content/imagens-para-substituir.html");
writeFileSync(arquivoHtml, html);

// ---------- PDF (usa o Chrome já instalado, sem dependência nova) ----------
const chromes = [
  process.env.CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].filter(Boolean);
const chrome = chromes.find((c) => existsSync(c));
const arquivoPdf = path.join(RAIZ, "content/imagens-para-substituir.pdf");
if (chrome) {
  execFileSync(chrome, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${arquivoPdf}`, pathToFileURL(arquivoHtml).href], { stdio: "ignore" });
  console.log("PDF gerado.");
} else {
  console.log("Chrome não encontrado: PDF não gerado (defina a variável CHROME com o caminho, se quiser).");
}
console.log(`${itens.length} de ${porArquivo.size} imagens abaixo de ${MINIMO}px. HTML: ${Math.round(html.length / 1024)} KB.`);
