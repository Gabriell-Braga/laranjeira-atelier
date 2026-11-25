// Imagens de compartilhamento (Open Graph): a logo quadrada (630×630), usada na Início e nas páginas
// sem imagem própria, e as capas (1200×630) para Livros e cada livro.
// Feitas a partir das versões WebP em public/img (não precisa dos originais), por isso rodam no build.
// Nas capas, sem texto na imagem: o título e a descrição vão nos metadados da página.
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const RAIZ = path.resolve(import.meta.dirname, "..");
const SAIDA = path.join(RAIZ, "public/og");
const manifesto = JSON.parse(readFileSync(path.join(RAIZ, "public/img/manifest.json"), "utf8"));
const W = 1200;
const H = 630;
const PAPEL = { r: 247, g: 244, b: 238 };

const webp = (arquivo) => {
  const m = manifesto[arquivo];
  if (!m) throw new Error(`og: imagem "${arquivo}" não está no manifest`);
  const largura = m.larguras.find((l) => l >= 1600) ?? m.larguras.at(-1);
  return path.join(RAIZ, "public/img", `${arquivo.replace(/\.[^.]+$/, "")}-${largura}.webp`);
};

// Logo clara no fundo laranja-escuro da marca (globals.css), quadrada como a miniatura do WhatsApp.
async function logo(destino) {
  const frente = await sharp(path.join(RAIZ, "public/img/marca/logo-claro.png")).trim().resize({ width: 540 }).toBuffer();
  await sharp({ create: { width: 630, height: 630, channels: 3, background: "#d9701c" } })
    .composite([{ input: frente }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(destino);
}

// Capa: fundo com a própria capa desfocada e clara, capa inteira no centro.
async function capa(arquivo, destino) {
  const fundo = await sharp(webp(arquivo)).flatten({ background: PAPEL }).resize(W, H, { fit: "cover" }).blur(40).modulate({ brightness: 1.15 }).toBuffer();
  const frente = await sharp(webp(arquivo)).flatten({ background: PAPEL }).resize({ height: H - 80, width: W - 120, fit: "inside" }).toBuffer();
  const { width, height } = await sharp(frente).metadata();
  await sharp(fundo)
    .composite([
      { input: { create: { width: W, height: H, channels: 4, background: { ...PAPEL, alpha: 0.55 } } } },
      { input: frente, left: Math.round((W - width) / 2), top: Math.round((H - height) / 2) },
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(destino);
}

mkdirSync(SAIDA, { recursive: true });
await logo(path.join(SAIDA, "logo.jpg"));

let n = 1;
for (const f of readdirSync(path.join(RAIZ, "content/livros")).filter((x) => x.endsWith(".json"))) {
  const l = JSON.parse(readFileSync(path.join(RAIZ, "content/livros", f), "utf8"));
  await capa(l.capa.arquivo, path.join(SAIDA, `livro-${l.slug}.jpg`));
  if (l.slug === "colecao-sertao-vivo") await capa(l.capa.arquivo, path.join(SAIDA, "livros.jpg"));
  n++;
}
console.log(`og: ${n + 1} imagens de compartilhamento em public/og`);
