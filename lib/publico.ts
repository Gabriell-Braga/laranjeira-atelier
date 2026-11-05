// Interruptor único da indexação. Prévia (padrão): noindex em todas as páginas e cabeçalhos.
// No lançamento: variável SITE_PUBLICO=sim na Vercel, em Production (ver docs/migracao-dominio.md).
// Lida pelo layout (meta robots) e por next.config.ts (cabeçalho X-Robots-Tag).
export const SITE_PUBLICO = process.env.SITE_PUBLICO === "sim";
