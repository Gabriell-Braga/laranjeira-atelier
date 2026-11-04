// Medição sem cookies e sem dados pessoais, no Workers Analytics Engine (grátis no plano Free).
// Cada registro guarda só: tipo ("compra" ou "contato"), item (livro ou assunto) e um detalhe
// (página de origem do clique, ou "enviado"/"teste"). Nada de IP, navegador ou identificador.
import site from "../content/site.json";

export type Metricas = { writeDataPoint(p: { blobs?: string[]; doubles?: number[]; indexes?: string[] }): void };
export type EnvMetricas = { METRICAS?: Metricas; CF_ACCOUNT_ID?: string; CF_ANALYTICS_TOKEN?: string; PAINEL_SENHA?: string };

const DATASET = "laranjeira_atelier";
const ROBO = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|monitor|lighthouse|headless/i;

export function registrar(env: EnvMetricas, tipo: string, item: string, detalhe = "") {
  try {
    env.METRICAS?.writeDataPoint({ blobs: [tipo, item, detalhe], doubles: [1], indexes: [tipo] });
  } catch {
    // medição nunca pode derrubar o site
  }
}

// /comprar/<slug>/ -> registra o clique e redireciona (302) para a oferta da Amazon em content/site.json.
export function comprar(req: Request, env: EnvMetricas, slug: string): Response {
  const amazon = (site.amazon as Record<string, string>)[slug];
  if (!amazon || slug.startsWith("_") || !/^https:\/\/www\.amazon\.com\.br\//.test(amazon)) {
    return new Response("Livro não encontrado.", { status: 404, headers: { "x-robots-tag": "noindex" } });
  }
  if (!ROBO.test(req.headers.get("user-agent") ?? "")) {
    let origem = "direto";
    try {
      const ref = new URL(req.headers.get("referer") ?? "");
      if (ref.host === new URL(req.url).host) origem = ref.pathname;
    } catch {}
    registrar(env, "compra", slug, origem);
  }
  return new Response(null, { status: 302, headers: { location: amazon, "cache-control": "no-store", "x-robots-tag": "noindex" } });
}

// ---------- /painel/: números em linguagem simples, protegido por senha ----------

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

async function consultar(env: EnvMetricas, sql: string) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/analytics_engine/sql`, {
    method: "POST",
    headers: { authorization: `Bearer ${env.CF_ANALYTICS_TOKEN}` },
    body: sql,
  });
  if (!r.ok) throw new Error(`consulta falhou (${r.status})`);
  return ((await r.json()) as { data: Record<string, string | number>[] }).data;
}

const NOMES_LIVROS: Record<string, string> = {
  "ave-sertao": "Ave, Sertão!",
  "vive-sertao": "Vive, Sertão!",
  "mburiti-sertao": "Mbur’iti, Sertão!",
  "sertao-sem-fim": "Sertão Sem Fim!",
  "colecao-sertao-vivo": "Coleção completa",
};

function tabela(titulo: string, linhas: [string, number][], vazio: string) {
  const corpo = linhas.length
    ? linhas.map(([n, v]) => `<tr><td>${esc(n)}</td><td class="n">${v}</td></tr>`).join("")
    : `<tr><td colspan="2">${vazio}</td></tr>`;
  return `<h2>${titulo}</h2><table>${corpo}</table>`;
}

export async function painel(req: Request, env: EnvMetricas): Promise<Response> {
  const cabecalhos = { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" };
  const [, credencial] = (req.headers.get("authorization") ?? "").split(" ");
  const senha = credencial ? atob(credencial).split(":").slice(1).join(":") : "";
  if (!env.PAINEL_SENHA || senha !== env.PAINEL_SENHA) {
    return new Response("Painel protegido.", { status: 401, headers: { ...cabecalhos, "www-authenticate": 'Basic realm="Painel Laranjeira Atelier", charset="UTF-8"' } });
  }
  if (!env.CF_ACCOUNT_ID || !env.CF_ANALYTICS_TOKEN) {
    return new Response("Falta configurar CF_ANALYTICS_TOKEN.", { status: 503, headers: cabecalhos });
  }
  const dias = Math.min(Math.max(Number(new URL(req.url).searchParams.get("dias")) || 30, 1), 90);
  const periodo = `timestamp > NOW() - INTERVAL '${dias}' DAY`;
  try {
    const [compras, origens, contatos] = await Promise.all([
      consultar(env, `SELECT blob2 AS item, SUM(_sample_interval) AS total FROM ${DATASET} WHERE blob1 = 'compra' AND ${periodo} GROUP BY item ORDER BY total DESC FORMAT JSON`),
      consultar(env, `SELECT blob3 AS item, SUM(_sample_interval) AS total FROM ${DATASET} WHERE blob1 = 'compra' AND ${periodo} GROUP BY item ORDER BY total DESC LIMIT 10 FORMAT JSON`),
      consultar(env, `SELECT blob2 AS item, SUM(_sample_interval) AS total FROM ${DATASET} WHERE blob1 = 'contato' AND blob3 = 'enviado' AND ${periodo} GROUP BY item ORDER BY total DESC FORMAT JSON`),
    ]);
    const linhas = (d: Record<string, string | number>[], nome = (s: string) => s) => d.map((x): [string, number] => [nome(String(x.item)), Math.round(Number(x.total))]);
    const totalCompras = compras.reduce((s, x) => s + Number(x.total), 0);
    const totalContatos = contatos.reduce((s, x) => s + Number(x.total), 0);
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Painel · Laranjeira Atelier</title>
<style>body{font:17px/1.5 system-ui,sans-serif;max-width:720px;margin:0 auto;padding:24px 16px;background:#F7F4EE;color:#2A2620}h1{font-size:28px}h2{font-size:20px;margin-top:32px}table{width:100%;border-collapse:collapse;background:#fff}td{padding:8px 12px;border-bottom:1px solid #E4DDD0}.n{text-align:right;font-weight:700}.resumo{display:flex;gap:16px;flex-wrap:wrap}.resumo div{background:#fff;padding:12px 16px;border-radius:4px;flex:1}.resumo b{display:block;font-size:32px}nav a{margin-right:12px;color:#2F4A2A}</style></head><body>
<h1>Painel do site</h1><nav>Período: <a href="?dias=7">7 dias</a><a href="?dias=30">30 dias</a><a href="?dias=90">90 dias</a></nav>
<p>Últimos ${dias} dias. Sem cookies e sem dados pessoais: só contamos cliques e envios.</p>
<div class="resumo"><div><b>${Math.round(totalCompras)}</b>cliques para comprar na Amazon</div><div><b>${Math.round(totalContatos)}</b>mensagens enviadas pelo formulário</div></div>
${tabela("Cliques para comprar, por livro", linhas(compras, (s) => NOMES_LIVROS[s] ?? s), "Nenhum clique ainda.")}
${tabela("De qual página veio o clique", linhas(origens), "Nenhum clique ainda.")}
${tabela("Mensagens do formulário, por assunto", linhas(contatos), "Nenhuma mensagem ainda.")}
<p style="margin-top:32px;font-size:15px;color:#5E574C">Os cliques contam quem clicou em "Comprar na Amazon" no site; a compra em si acontece na Amazon e não aparece aqui. Robôs e pré-visualizações de link são ignorados.</p>
</body></html>`;
    return new Response(html, { headers: cabecalhos });
  } catch (e) {
    return new Response(`Não foi possível ler os números agora: ${esc(String(e))}`, { status: 502, headers: cabecalhos });
  }
}
