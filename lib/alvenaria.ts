// Grade em alvenaria calculada por proporção, sem medir nada no navegador.
// Cada item vai para a coluna mais curta. A posição é guardada como
// (coluna, soma das proporções acima, quantidade de itens acima), e o CSS
// converte isso em pixels com a largura real da coluna (ver .alvenaria em globals.css).
// Itens novos entram no fim das colunas: os anteriores nunca mudam de lugar.

export const COLUNAS = [1, 2, 3] as const;
export type NumColunas = (typeof COLUNAS)[number];

// Largura típica da coluna e espaço entre itens, só para decidir qual coluna é a mais curta.
const LARGURA_TIPICA: Record<NumColunas, number> = { 1: 350, 2: 340, 3: 384 };
const ESPACO: Record<NumColunas, number> = { 1: 16, 2: 20, 3: 24 };

export type Posicao = { c: number; r: number; k: number };
export type Layout = { posicoes: Posicao[]; alturaR: number; alturaK: number };

/** proporcoes = altura / largura de cada item, na ordem de exibição */
export function posicionar(proporcoes: number[], n: NumColunas): Layout {
  const r = Array<number>(n).fill(0);
  const k = Array<number>(n).fill(0);
  const fator = ESPACO[n] / LARGURA_TIPICA[n];
  const posicoes = proporcoes.map((p) => {
    let c = 0;
    for (let i = 1; i < n; i++) if (r[i] + k[i] * fator < r[c] + k[c] * fator - 1e-9) c = i;
    const pos = { c, r: r[c], k: k[c] };
    r[c] += p;
    k[c] += 1;
    return pos;
  });
  // Altura da área: coluna mais alta (o espaço depois do último item não conta).
  let alto = 0;
  for (let i = 1; i < n; i++) if (r[i] + k[i] * fator > r[alto] + k[alto] * fator) alto = i;
  return { posicoes, alturaR: r[alto], alturaK: Math.max(k[alto] - 1, 0) };
}

const arred = (v: number) => Math.round(v * 10000) / 10000;

/** Variáveis CSS de um item nas três larguras de tela. */
export function estiloItem(layouts: Record<NumColunas, Layout>, i: number, proporcao: number) {
  const s: Record<string, string | number> = { aspectRatio: String(arred(1 / proporcao)) };
  for (const n of COLUNAS) {
    const p = layouts[n].posicoes[i];
    s[`--c${n}`] = p.c;
    s[`--r${n}`] = arred(p.r);
    s[`--k${n}`] = p.k;
  }
  return s;
}

/** Variáveis CSS da altura da área nas três larguras de tela. */
export function estiloArea(layouts: Record<NumColunas, Layout>) {
  const s: Record<string, number> = {};
  for (const n of COLUNAS) {
    s[`--R${n}`] = arred(layouts[n].alturaR);
    s[`--K${n}`] = layouts[n].alturaK;
  }
  return s;
}

export const calcularLayouts = (proporcoes: number[]) =>
  Object.fromEntries(COLUNAS.map((n) => [n, posicionar(proporcoes, n)])) as Record<NumColunas, Layout>;

// Teste rápido: node lib/alvenaria.ts
if (typeof process !== "undefined" && process.argv[1]?.endsWith("alvenaria.ts")) {
  const props = [1.2, 0.5, 0.8, 1, 0.7, 1.5, 0.6];
  const tudo = posicionar(props, 3);
  const parte = posicionar(props.slice(0, 4), 3);
  console.assert(JSON.stringify(parte.posicoes) === JSON.stringify(tudo.posicoes.slice(0, 4)), "itens anteriores não podem mudar de lugar");
  console.assert(tudo.posicoes[0].c === 0 && tudo.posicoes[1].c === 1 && tudo.posicoes[2].c === 2, "primeira linha preenche as colunas em ordem");
  console.assert(tudo.posicoes[3].c === 1, "quarto item vai para a coluna mais curta");
  console.log("alvenaria: ok", tudo.posicoes);
}
