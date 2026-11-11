// Manchas de aquarela atrás dos títulos: recortes de lavagens reais das pranchas da Dilce
// (só fundo, sem bicho). O branco do papel vira transparência ("desmultiplica" do branco),
// e as bordas do recorte esmaecem numa elipse para não aparecer o corte reto.
// Uso: node scripts/manchas.mjs  (lê content/originais, grava public/img/manchas/*.webp)
import sharp from "sharp";

const L = 900;
const A = 450; // todas 2:1, o CSS conta com isso

// [arquivo, x, y, largura, altura] em frações da imagem original; girar = pinceladas na horizontal
const manchas = {
  lilas: ["ave-sertao/tucano-destaque", 0.5, 0, 0.5, 0.13],
  verde: ["vive-sertao/onca", 0.04, 0.05, 0.55, 0.28],
  cinza: ["vive-sertao/anta", 0, 0.04, 1, 0.42],
  pincel: ["ave-sertao/suindara", 0.77, 0.02, 0.22, 0.48, true],
};

for (const [nome, [arq, x, y, w, h, girar]] of Object.entries(manchas)) {
  const src = `content/originais/livros/${arq}.jpg`;
  const { width, height } = await sharp(src).metadata();
  let img = sharp(src).extract({
    left: Math.round(x * width),
    top: Math.round(y * height),
    width: Math.min(Math.round(w * width), width - Math.round(x * width)),
    height: Math.min(Math.round(h * height), height - Math.round(y * height)),
  });
  if (girar) img = sharp(await img.rotate(90).toBuffer());
  const { data } = await img.resize(L, A, { fit: "cover" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });

  const fase = nome.length * 1.7; // cada mancha com um contorno diferente, mas sempre o mesmo
  const out = Buffer.alloc(L * A * 4);
  for (let i = 0; i < L * A; i++) {
    const [r, g, b] = [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];
    // quanto de pigmento há no pixel (0 = papel branco)
    let a = Math.max(255 - r, 255 - g, 255 - b) / 255;
    const px = (i % L) / L - 0.5;
    const py = Math.floor(i / L) / A - 0.5;
    // distância "quase retangular" ao centro, com a borda ondulada por senos (contorno de poça, não de elipse)
    const ang = Math.atan2(py, px);
    const onda = 0.09 * Math.sin(3 * ang + fase) + 0.06 * Math.sin(5 * ang + 2 * fase) + 0.04 * Math.sin(9 * ang + 3 * fase);
    const d = Math.pow(Math.abs(px * 2) ** 3 + Math.abs(py * 2) ** 3, 1 / 3) + onda; // 1 = borda do recorte
    const borda = Math.min(1, Math.max(0, (1.02 - d) / 0.45));
    const alfa = Math.min(1, a * 1.15) * borda * borda * (3 - 2 * borda);
    // cor sem o branco: c = 255 - (255 - c_original) / a
    const cor = (c) => (a > 0.01 ? Math.max(0, Math.round(255 - (255 - c) / a)) : 255);
    out[i * 4] = cor(r);
    out[i * 4 + 1] = cor(g);
    out[i * 4 + 2] = cor(b);
    out[i * 4 + 3] = Math.round(alfa * 255);
  }
  await sharp(out, { raw: { width: L, height: A, channels: 4 } })
    .webp({ quality: 80, alphaQuality: 80 })
    .toFile(`public/img/manchas/${nome}.webp`);
}
