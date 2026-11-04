// Confere a planilha do portfólio contra as imagens e diz o que falta.
// Uso: npm run portfolio   (gera as imagens novas antes)
//
// Fluxo para trabalhos novos:
//  1. Coloque as imagens em content/originais/portfolio/<serie>/ (a série precisa existir em
//     content/portfolio/series.json).
//  2. Rode npm run portfolio. As imagens sem linha na planilha vão para
//     content/portfolio-novas-linhas.csv, já com arquivo, série e tipo preenchidos.
//  3. Copie essas linhas para a planilha (Google Sheets), preencha título, técnica, ano, alt...
//     exporte como CSV e salve por cima de content/portfolio.csv.
//  4. Rode npm run portfolio de novo até não sobrar problema grave.
// O script não inventa texto: item sem título nem alt (ou sem alt) fica fora do site.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { COLUNAS, lerPortfolioCsv, lerSeries } from "../lib/portfolio-dados.ts";

const RAIZ = path.resolve(import.meta.dirname, "..");
const MINIMO = 1600;
const manifesto = JSON.parse(readFileSync(path.join(RAIZ, "public/img/manifest.json"), "utf8"));
const { itens, problemas } = lerPortfolioCsv(RAIZ, (a) => a in manifesto);
const series = lerSeries(RAIZ);
const porSlug = new Map(series.map((s) => [s.slug, s]));

// Imagens nas pastas do portfólio que ainda não têm linha na planilha
const PASTA = path.join(RAIZ, "content/originais/portfolio");
const naPlanilha = new Set(readFileSync(path.join(RAIZ, "content/portfolio.csv"), "utf8").split(/\r?\n/).map((l) => l.split(",")[0].replace(/^"|"$/g, "")));
const semLinha = [];
const pastasDesconhecidas = [];
if (existsSync(PASTA)) {
  for (const d of readdirSync(PASTA, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    if (!porSlug.has(d.name)) pastasDesconhecidas.push(d.name);
    for (const f of readdirSync(path.join(PASTA, d.name))) {
      if (!/\.(jpe?g|png|webp|tiff?)$/i.test(f)) continue;
      const arquivo = `portfolio/${d.name}/${f}`;
      if (!naPlanilha.has(arquivo)) semLinha.push({ arquivo, serie: d.name, tipo: porSlug.get(d.name)?.tipo ?? "" });
    }
  }
}

const pequenas = itens.filter((i) => manifesto[i.arquivo].largura < MINIMO);
const graves = problemas.filter((p) => p.grave);
const avisos = problemas.filter((p) => !p.grave);
const onde = (p) => `linha ${p.linha}${p.arquivo ? ` (${p.arquivo})` : ""}`;

console.log(`\nPortfólio: ${itens.length} itens no site, ${series.length} séries.\n`);
if (semLinha.length) {
  const esc = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const linhas = [COLUNAS.join(","), ...semLinha.map((s) => COLUNAS.map((c) => esc(s[c] ?? "")).join(","))];
  writeFileSync(path.join(RAIZ, "content/portfolio-novas-linhas.csv"), linhas.join("\n") + "\n");
  console.log(`Imagens sem linha na planilha (${semLinha.length}): copie de content/portfolio-novas-linhas.csv`);
  for (const s of semLinha) console.log(`  - ${s.arquivo}`);
}
if (pastasDesconhecidas.length) {
  console.log(`\nPastas sem série correspondente em content/portfolio/series.json: ${pastasDesconhecidas.join(", ")}`);
}
if (graves.length) {
  console.log(`\nFicam fora do site (${graves.length}):`);
  for (const p of graves) console.log(`  - ${onde(p)}: ${p.mensagem}`);
}
if (avisos.length) {
  console.log(`\nAvisos (${avisos.length}):`);
  for (const p of avisos) console.log(`  - ${onde(p)}: ${p.mensagem}`);
}
if (pequenas.length) {
  console.log(`\nImagens abaixo de ${MINIMO}px de largura (${pequenas.length}). Veja content/imagens-baixa-resolucao.md.`);
}
const semAno = itens.filter((i) => !i.ano).length;
console.log(`\nSem ano: ${semAno}. Sem técnica: ${itens.filter((i) => !i.tecnicas.length).length}. Em destaque: ${itens.filter((i) => i.destaque).length}.`);
if (!semLinha.length && !graves.length) console.log("\nNenhum problema grave.");
