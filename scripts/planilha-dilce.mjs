// Planilha do portfólio para a Dilce preencher no Google Sheets, com miniaturas.
//
//   node scripts/planilha-dilce.mjs gerar
//     Gera content/portfolio-para-dilce.csv a partir de content/portfolio.csv.
//
//   node scripts/planilha-dilce.mjs importar <arquivo.csv exportado do Google Sheets>
//     Copia de volta para content/portfolio.csv: titulo, serie, tecnica, ano, destaque, descricao e alt,
//     casando as linhas pela coluna "arquivo". As outras colunas não mudam.
//     Ano novo ou alterado pela Dilce fica com ano_fonte = "Dilce".
//     Depois rode: npm run portfolio
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { COLUNAS, lerCsv, lerSeries, normalizarTecnica, TECNICAS } from "../lib/portfolio-dados.ts";

const RAIZ = path.resolve(import.meta.dirname, "..");
const ENDERECO = process.env.ENDERECO_SITE ?? "https://laranjeira-atelier.hub-villa-deli.workers.dev";
const CSV_OFICIAL = path.join(RAIZ, "content/portfolio.csv");
const manifesto = JSON.parse(readFileSync(path.join(RAIZ, "public/img/manifest.json"), "utf8"));
const series = lerSeries(RAIZ);

const esc = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) || s.startsWith("=") ? `"${s.replace(/"/g, '""')}"` : s;
};
const BOM = "﻿"; // acentos certos ao abrir no Sheets e no Excel
const escrever = (arquivo, colunas, linhas, bom = false) =>
  writeFileSync(arquivo, (bom ? BOM : "") + [colunas.join(","), ...linhas.map((l) => colunas.map((c) => esc(l[c])).join(","))].join("\n") + "\n");

const COLUNAS_DILCE = ["miniatura", "numero", "titulo", "serie", "tecnica", "ano", "destaque", "descricao", "arquivo", "alt", "ano_fonte"];
const oficial = lerCsv(readFileSync(CSV_OFICIAL, "utf8"));
const [modo, entrada] = process.argv.slice(2);

if (modo === "gerar") {
  // Miniaturas em JPG de 480px (o Google Sheets pode não mostrar WebP), publicadas com o site
  // em /planilha/<nome>.jpg. Feitas a partir das versões WebP já geradas: não precisa dos originais.
  const pasta = path.join(RAIZ, "public/planilha");
  mkdirSync(pasta, { recursive: true });
  const urls = [];
  for (const l of oficial) {
    const m = manifesto[l.arquivo];
    if (!m) {
      urls.push("");
      continue;
    }
    const base = l.arquivo.replace(/\.[^.]+$/, "");
    const fonte = path.join(RAIZ, "public/img", `${base}-${m.larguras.find((w) => w >= 480) ?? m.larguras.at(-1)}.webp`);
    const nome = `${path.basename(base)}.jpg`;
    await sharp(fonte).flatten({ background: "#ffffff" }).resize({ width: 480, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(pasta, nome));
    urls.push(`${ENDERECO}/planilha/${nome}`);
  }
  const linhas = oficial.map((l, i) => {
    const url = urls[i];
    return {
      miniatura: url ? `=IMAGE("${url}")` : "",
      numero: i + 1,
      titulo: l.titulo,
      serie: series.find((s) => s.slug === l.serie)?.titulo ?? l.serie,
      tecnica: l.tecnica
        .split(";")
        .filter(Boolean)
        .map((t) => TECNICAS[normalizarTecnica(t)] ?? t)
        .join("; "),
      ano: l.ano,
      destaque: (l.destaque || "").toLowerCase() === "sim" ? "sim" : "",
      descricao: l.descricao,
      arquivo: l.arquivo,
      alt: l.alt,
      ano_fonte: l.ano_fonte,
    };
  });
  const saida = path.join(RAIZ, "content/portfolio-para-dilce.csv");
  escrever(saida, COLUNAS_DILCE, linhas, true); // BOM: acentos certos no Sheets e no Excel
  console.log(`${linhas.length} linhas em ${path.relative(RAIZ, saida)}`);
} else if (modo === "importar" && entrada) {
  const daDilce = lerCsv(readFileSync(entrada, "utf8"));
  const porArquivo = new Map(oficial.map((l) => [l.arquivo, l]));
  const serieDe = (v) => {
    const s = series.find((x) => x.titulo.toLowerCase() === v.toLowerCase() || x.slug === v);
    return s?.slug;
  };
  let alteradas = 0;
  const avisos = [];
  for (const [i, d] of daDilce.entries()) {
    const linha = `linha ${i + 2}`;
    if (!d.arquivo) {
      if (d.titulo || d.descricao) avisos.push(`${linha}: sem a coluna "arquivo" (linha nova? coloque a imagem em content/originais/portfolio/ e rode npm run portfolio)`);
      continue;
    }
    const o = porArquivo.get(d.arquivo);
    if (!o) {
      avisos.push(`${linha}: arquivo "${d.arquivo}" não está em content/portfolio.csv`);
      continue;
    }
    const antes = JSON.stringify(o);
    o.titulo = d.titulo ?? o.titulo;
    if (d.serie) {
      const s = serieDe(d.serie);
      if (s) o.serie = s;
      else avisos.push(`${linha}: série "${d.serie}" não existe; mantida "${o.serie}"`);
    }
    if (d.tecnica !== undefined) {
      const tecnicas = d.tecnica.split(/[;,]/).map(normalizarTecnica).filter(Boolean);
      const invalidas = tecnicas.filter((t) => !(t in TECNICAS));
      if (invalidas.length) avisos.push(`${linha}: técnica "${invalidas.join(", ")}" desconhecida (use Aquarela, Desenho, Digital ou Gravura)`);
      o.tecnica = tecnicas.filter((t) => t in TECNICAS).join(";");
    }
    if (d.ano !== undefined && d.ano !== o.ano) {
      o.ano = d.ano;
      o.ano_fonte = d.ano ? "Dilce" : "";
    }
    if (d.destaque !== undefined) o.destaque = d.destaque.trim().toLowerCase() === "sim" ? "sim" : "";
    if (d.descricao !== undefined) o.descricao = d.descricao;
    if (d.alt) o.alt = d.alt;
    if (JSON.stringify(o) !== antes) alteradas++;
  }
  escrever(CSV_OFICIAL, [...COLUNAS], oficial);
  console.log(`${alteradas} linha(s) atualizadas em content/portfolio.csv.`);
  for (const a of avisos) console.log(`  - ${a}`);
  console.log("Agora rode: npm run portfolio");
} else {
  console.log("Uso: node scripts/planilha-dilce.mjs gerar | importar <arquivo.csv>");
  process.exitCode = 1;
}
