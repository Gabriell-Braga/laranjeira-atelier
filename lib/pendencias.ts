// Marcadores [PREENCHER: ...]: aparecem destacados em desenvolvimento (npm run dev)
// e somem do build de produção. scripts/verificar-build.mjs garante que nenhum vazou.

export const MOSTRAR_PENDENCIAS = process.env.NODE_ENV !== "production";

export const MARCADOR = /\[PREENCHER:[^\]]*\]/g;

export const pendente = (texto: string | undefined) => !texto || texto.trim().startsWith("[PREENCHER");

// Markdown: em produção remove linhas que são só marcador e os marcadores no meio do texto.
export function tratarMarkdown(md: string) {
  if (MOSTRAR_PENDENCIAS) return md;
  return md.replace(/^[ \t]*(?:[-*][ \t]+)?\[PREENCHER:[^\]]*\][ \t]*$/gm, "").replace(/[ \t]*\[PREENCHER:[^\]]*\]/g, "");
}

// HTML já gerado: em desenvolvimento destaca os marcadores.
export const destacarPendencias = (html: string) =>
  MOSTRAR_PENDENCIAS ? html.replace(MARCADOR, (m) => `<mark class="preencher">${m}</mark>`) : html;
