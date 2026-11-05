// Interruptor único da indexação. Prévia (padrão): noindex em todas as páginas e cabeçalhos.
// No lançamento: variável de build SITE_PUBLICO=sim no Cloudflare (ver docs/migracao-dominio.md).
// Também lida por scripts/verificar-build.mjs, que acrescenta o X-Robots-Tag em out/_headers.
export const SITE_PUBLICO = process.env.SITE_PUBLICO === "sim";
