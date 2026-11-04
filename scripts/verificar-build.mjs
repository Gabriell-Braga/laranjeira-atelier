// Roda depois do next build: falha se algum [PREENCHER] vazou para out/
// e lista o que ainda está pendente em content/ (só informativo).
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const RAIZ = path.resolve(import.meta.dirname, "..");
const TEXTO = /\.(html|txt|json|js|xml|css|rsc)$/;

const arquivos = (dir) =>
  readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((d) => d.isFile())
    .map((d) => path.join(d.parentPath, d.name));

const vazados = arquivos(path.join(RAIZ, "out"))
  .filter((f) => TEXTO.test(f) && readFileSync(f, "utf8").includes("[PREENCHER"))
  .map((f) => path.relative(RAIZ, f));

const pendencias = arquivos(path.join(RAIZ, "content"))
  .filter((f) => !f.includes(`${path.sep}originais${path.sep}`) && !f.includes(`${path.sep}importacao${path.sep}`) && /\.(json|md)$/.test(f))
  .filter((f) => !/importacao\.md|imagens-baixa-resolucao\.md/.test(f))
  .map((f) => [path.relative(RAIZ, f), (readFileSync(f, "utf8").match(/\[PREENCHER/g) ?? []).length])
  .filter(([, n]) => n > 0);

if (pendencias.length) {
  console.log(`\nPendências em content/ (escondidas no site): ${pendencias.reduce((s, [, n]) => s + n, 0)}`);
  for (const [f, n] of pendencias) console.log(`  ${f}: ${n}`);
}

if (vazados.length) {
  console.error(`\nERRO: [PREENCHER] apareceu no site gerado em:\n  ${vazados.join("\n  ")}\n`);
  process.exit(1);
}
console.log("\nverificar-build: nenhum [PREENCHER] no site gerado.");
