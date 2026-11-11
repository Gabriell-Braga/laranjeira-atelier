// Gera as manchas de aquarela (SVG com filtro de ruído) usadas atrás de textos e imagens.
// Cada mancha: duas lavagens que esmaecem para as bordas, contorno irregular pelo ruído grosso
// e granulação (pigmento acumulado e falhas no papel) pelo ruído fino. Uso: node scripts/manchas.mjs
import { writeFileSync } from "node:fs";

const cores = {
  lilas: ["#b3a6c2", "#cdc4d8"], // a lavagem atrás do tucano
  areia: ["#dcb58a", "#ead3b8"],
  ceu: ["#a3afd3", "#c4cbe5"],
  vereda: ["#a2b494", "#c6d2ba"],
};

const svg = ([forte, fraca], seed) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" preserveAspectRatio="none">
<radialGradient id="a"><stop offset=".3" stop-color="${fraca}"/><stop offset=".75" stop-color="${fraca}" stop-opacity=".7"/><stop offset="1" stop-color="${fraca}" stop-opacity="0"/></radialGradient>
<radialGradient id="b"><stop offset=".1" stop-color="${forte}"/><stop offset="1" stop-color="${forte}" stop-opacity="0"/></radialGradient>
<filter id="f" x="0" y="0" width="100%" height="100%">
<feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" seed="${seed}" result="r"/>
<feDisplacementMap in="SourceGraphic" in2="r" scale="90" xChannelSelector="R" yChannelSelector="G" result="d"/>
<feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" seed="${seed + 7}" result="g"/>
<feColorMatrix in="g" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1.6 1.55" result="m"/>
<feComposite in="d" in2="m" operator="in"/>
</filter>
<g filter="url(#f)">
<ellipse cx="300" cy="200" rx="245" ry="155" fill="url(#a)"/>
<ellipse cx="${260 + (seed % 3) * 35}" cy="${185 + (seed % 2) * 30}" rx="170" ry="110" fill="url(#b)"/>
</g>
</svg>`;

let seed = 2;
for (const [nome, par] of Object.entries(cores)) writeFileSync(`public/img/manchas/${nome}.svg`, svg(par, (seed += 3)));
