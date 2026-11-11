// Gera app/icon.png, app/apple-icon.png e app/favicon.ico: o passarinho do logo dentro de um
// círculo cor de areia (aparece bem em abas claras e escuras).
// Uso: node scripts/favicon.mjs [passaro.png] [cor]
// passaro.png = o passarinho recortado do logo, fundo transparente (content/originais/marca/passaro.png)
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const [passaro = "content/originais/marca/passaro.png", cor = "#eedbc5"] = process.argv.slice(2);

// lado L; o pássaro ocupa ~66% do lado, centrado
async function icone(L, forma) {
  const fundo =
    forma === "circulo"
      ? `<svg width="${L}" height="${L}"><circle cx="${L / 2}" cy="${L / 2}" r="${L / 2}" fill="${cor}"/></svg>`
      : `<svg width="${L}" height="${L}"><rect width="${L}" height="${L}" fill="${cor}"/></svg>`;
  const lado = Math.round(L * 0.66);
  const ave = await sharp(passaro).resize(lado, lado, { fit: "inside" }).toBuffer();
  const { width, height } = await sharp(ave).metadata();
  return sharp(Buffer.from(fundo))
    .composite([{ input: ave, left: Math.round((L - width) / 2), top: Math.round((L - height) / 2) }])
    .png()
    .toBuffer();
}

writeFileSync("app/icon.png", await icone(96, "circulo"));
// iOS arredonda os cantos sozinho: aqui o quadrado inteiro é areia
writeFileSync("app/apple-icon.png", await sharp(await icone(180, "quadrado")).flatten({ background: cor }).png().toBuffer());

const tamanhos = [16, 32, 48];
const pngs = await Promise.all(tamanhos.map(async (s) => sharp(await icone(s * 4, "circulo")).resize(s, s).png().toBuffer()));
const cab = Buffer.alloc(6 + 16 * pngs.length);
cab.writeUInt16LE(1, 2);
cab.writeUInt16LE(pngs.length, 4);
let off = cab.length;
pngs.forEach((b, i) => {
  const s = tamanhos[i];
  const o = 6 + 16 * i;
  cab.writeUInt8(s, o);
  cab.writeUInt8(s, o + 1);
  cab.writeUInt16LE(1, o + 4);
  cab.writeUInt16LE(32, o + 6);
  cab.writeUInt32LE(b.length, o + 8);
  cab.writeUInt32LE(off, o + 12);
  off += b.length;
});
writeFileSync("app/favicon.ico", Buffer.concat([cab, ...pngs]));
