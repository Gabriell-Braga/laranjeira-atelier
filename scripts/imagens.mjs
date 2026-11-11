// Gera as versões web das imagens.
// Uso: npm run imagens (roda sozinho antes do build)
//
// Lê content/originais e grava em public/img:
//   <caminho>-<largura>.webp nas larguras 480, 960, 1600 e 2400 (nunca amplia)
//   public/img/manifest.json com largura, altura, cor dominante e placeholder borrado.
// Só reprocessa o que mudou (compara um hash do original).
// Se os originais não estiverem na máquina (por exemplo, no build do Cloudflare),
// mantém o que já está no manifest e nas pastas geradas.
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, readdir, rm, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const RAIZ = path.resolve(import.meta.dirname, "..");
const ORIGINAIS = path.join(RAIZ, "content/originais");
const SAIDA = path.join(RAIZ, "public/img");
const MANIFEST = path.join(SAIDA, "manifest.json");
// 720: celulares comuns (360–412 pontos × densidade ~2) não precisam baixar a de 960.
const LARGURAS = [480, 720, 960, 1600, 2400];
// Ilustrações dos livros (aquarela com detalhe fino) saem com compressão mais leve.
const qualidadePara = (arquivo) => (arquivo.startsWith("livros/") ? 90 : 82);
const larguraPara = (w) => {
  const l = LARGURAS.filter((x) => x < w);
  if (l.length < LARGURAS.length) l.push(Math.min(w, 2400)); // inclui o tamanho original (se < 2400)
  return l;
};

const existe = (f) => access(f).then(() => true, () => false);

async function listar(dir) {
  if (!(await existe(dir))) return [];
  const itens = await readdir(dir, { withFileTypes: true, recursive: true });
  return itens
    .filter((i) => i.isFile() && /\.(jpe?g|png|webp|tiff?)$/i.test(i.name))
    .map((i) => path.relative(ORIGINAIS, path.join(i.parentPath, i.name)).replaceAll("\\", "/"));
}

const semExtensao = (f) => f.replace(/\.[^.]+$/, "");

const manifest = (await existe(MANIFEST)) ? JSON.parse(await readFile(MANIFEST, "utf8")) : {};
const arquivos = await listar(ORIGINAIS);

if (!arquivos.length) {
  console.log(`imagens: sem originais nesta máquina; usando as ${Object.keys(manifest).length} já geradas.`);
  process.exit(0);
}

// Se dois originais têm o mesmo nome com extensões diferentes, as saídas se misturam.
const base = new Map();
for (const f of arquivos) {
  const b = semExtensao(f);
  if (base.has(b)) throw new Error(`imagens: "${f}" e "${base.get(b)}" geram o mesmo nome. Renomeie um deles.`);
  base.set(b, f);
}

let geradas = 0;
for (const arquivo of arquivos) {
  const buffer = await readFile(path.join(ORIGINAIS, arquivo));
  const hash = createHash("sha1").update(buffer).digest("hex").slice(0, 12);
  const antes = manifest[arquivo];
  // pula se o original e a lista de larguras não mudaram
  const qualidade = qualidadePara(arquivo);
  if (antes?.hash === hash && (antes.qualidade ?? 82) === qualidade && JSON.stringify(antes.larguras) === JSON.stringify(larguraPara(antes.largura))) continue;

  const img = sharp(buffer).rotate(); // respeita a orientação EXIF
  const meta = await img.metadata();
  const [w, h] = (meta.orientation ?? 1) >= 5 ? [meta.height, meta.width] : [meta.width, meta.height];
  const larguras = larguraPara(w);

  const destino = path.join(SAIDA, semExtensao(arquivo));
  await mkdir(path.dirname(destino), { recursive: true });
  for (const l of larguras) {
    await img.clone().resize({ width: l }).webp({ quality: qualidade, effort: 5 }).toFile(`${destino}-${l}.webp`);
  }

  const { dominant } = await img.clone().stats();
  const placeholder = await img.clone().resize({ width: 24 }).webp({ quality: 40 }).toBuffer();
  manifest[arquivo] = {
    hash,
    largura: w,
    altura: h,
    larguras,
    qualidade,
    cor: "#" + [dominant.r, dominant.g, dominant.b].map((c) => c.toString(16).padStart(2, "0")).join(""),
    transparente: Boolean(meta.hasAlpha),
    placeholder: "data:image/webp;base64," + placeholder.toString("base64"),
  };
  geradas++;
}

// Com --limpar, remove do manifest (e do disco) o que não existe mais nos originais.
// Sem a flag, nada é apagado: assim uma cópia incompleta dos originais não some com imagens.
let removidas = 0;
for (const arquivo of Object.keys(manifest)) {
  if (arquivos.includes(arquivo) || !process.argv.includes("--limpar")) continue;
  for (const l of manifest[arquivo].larguras) await rm(path.join(SAIDA, `${semExtensao(arquivo)}-${l}.webp`), { force: true });
  delete manifest[arquivo];
  removidas++;
}

const ordenado = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(MANIFEST, JSON.stringify(ordenado, null, 1) + "\n");
console.log(`imagens: ${geradas} processadas, ${removidas} removidas, ${arquivos.length} no total.`);
