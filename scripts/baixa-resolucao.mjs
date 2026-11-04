// Gera content/imagens-baixa-resolucao.md: imagens usadas no site com menos de 1600px
// de largura, das mais importantes (livros, topo das páginas) para as menos.
// Uso: node scripts/baixa-resolucao.mjs
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const RAIZ = path.resolve(import.meta.dirname, "..");
const MINIMO = 1600;
const manifesto = JSON.parse(readFileSync(path.join(RAIZ, "public/img/manifest.json"), "utf8"));
const json = (rel) => JSON.parse(readFileSync(path.join(RAIZ, "content", rel), "utf8"));
const lista = (pasta) => readdirSync(path.join(RAIZ, "content", pasta)).filter((f) => f.endsWith(".json")).map((f) => json(`${pasta}/${f}`));

const usos = []; // [arquivo, onde]
for (const f of readdirSync(path.join(RAIZ, "content/paginas"))) {
  const { data } = matter(readFileSync(path.join(RAIZ, "content/paginas", f), "utf8"));
  if (data.imagemDestaque && data.imagemDestaque in manifesto) usos.push([data.imagemDestaque, `Topo da página ${f === "inicio.md" ? "Início" : data.titulo}`]);
}
for (const l of lista("livros").sort((a, b) => a.ordem - b.ordem)) {
  usos.push([l.capa.arquivo, `Livro ${l.titulo}: capa (página do livro, cartões, Início)`]);
  for (const i of l.imagens) usos.push([i.arquivo, `Livro ${l.titulo}: galeria (${i.titulo ?? "imagem"})`]);
}
for (const s of lista("portfolio").sort((a, b) => a.ordem - b.ordem)) {
  for (const i of s.itens) usos.push([i.arquivo, `Portfólio, série ${s.titulo}: ${i.titulo ?? ""}`]);
}

const vistos = new Map();
for (const [arquivo, onde] of usos) {
  if (!vistos.has(arquivo)) vistos.set(arquivo, []);
  vistos.get(arquivo).push(onde);
}
const linhas = [...vistos]
  .filter(([a]) => manifesto[a].largura < MINIMO)
  .map(([a, onde], n) => `| ${n + 1} | \`${path.basename(a)}\` | ${onde.join("<br>")} | ${manifesto[a].largura} × ${manifesto[a].altura} px |`);

writeFileSync(
  path.join(RAIZ, "content/imagens-baixa-resolucao.md"),
  `# Imagens em baixa resolução

Imagens usadas no site com menos de ${MINIMO}px de largura, em ordem de importância (livros e topo das páginas primeiro).
Para o zoom do site ficar nítido, o ideal é ter cada uma com **pelo menos 2400px no lado maior**.

Como substituir: salve o arquivo novo com **o mesmo nome** no lugar do antigo, em \`content/originais/wix/...\`.
Também serve JPG ou PNG exportado direto do arquivo de trabalho. Não precisa reduzir: o site gera as versões menores sozinho.

Total: ${linhas.length} de ${vistos.size} imagens usadas.

| # | Arquivo | Onde aparece | Tamanho atual |
|---|---|---|---|
${linhas.join("\n")}
`,
);
console.log(`${linhas.length} de ${vistos.size} imagens abaixo de ${MINIMO}px.`);
