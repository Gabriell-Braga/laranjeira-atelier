// Gera app/icon.png, app/apple-icon.png e app/favicon.ico com o passarinho do logo.
// Uso: node scripts/favicon.mjs "<Logo Atelier.png>" "#f7f4ee"
import sharp from "sharp";
import { writeFileSync } from "node:fs";
const [logo, fundo] = process.argv.slice(2);
const recorte = await sharp(logo).extract({ left: 1108, top: 0, width: 315, height: 438 }).png().toBuffer();
const passaro = await sharp(recorte).trim().png().toBuffer();
const m = await sharp(passaro).metadata();
// margem de ~14% em volta: o pássaro fica um pouco menor dentro do ícone
const lado = Math.round(Math.max(m.width, m.height) / 0.72);
const quadrado = (bg) => sharp(passaro).extend({
  top: Math.floor((lado - m.height) / 2), bottom: Math.ceil((lado - m.height) / 2),
  left: Math.floor((lado - m.width) / 2), right: Math.ceil((lado - m.width) / 2),
  background: bg,
}).png().toBuffer();
const transparente = await quadrado({ r: 0, g: 0, b: 0, alpha: 0 });
await sharp(transparente).resize(96, 96).png().toFile("app/icon.png");
await sharp(await quadrado(fundo)).flatten({ background: fundo }).resize(180, 180).png().toFile("app/apple-icon.png");
const pngs = await Promise.all([16, 32, 48].map((s) => sharp(transparente).resize(s, s).png().toBuffer()));
const cab = Buffer.alloc(6 + 16 * pngs.length);
cab.writeUInt16LE(1, 2); cab.writeUInt16LE(pngs.length, 4);
let off = cab.length;
pngs.forEach((b, i) => {
  const s = [16, 32, 48][i], o = 6 + 16 * i;
  cab.writeUInt8(s, o); cab.writeUInt8(s, o + 1); cab.writeUInt16LE(1, o + 4); cab.writeUInt16LE(32, o + 6);
  cab.writeUInt32LE(b.length, o + 8); cab.writeUInt32LE(off, o + 12); off += b.length;
});
writeFileSync("app/favicon.ico", Buffer.concat([cab, ...pngs]));
console.log("passaro", m.width, m.height, "lado", lado);
