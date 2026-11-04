// Worker do site. Os arquivos estáticos (out/) são servidos direto pelo Cloudflare;
// este código só roda para /api/*, /comprar/* e /painel/ (ver run_worker_first em wrangler.jsonc).
//
// /comprar/<livro>/  conta o clique (sem dados pessoais) e redireciona para a Amazon (worker/metricas.ts)
// /painel/           números de cliques e mensagens, com senha (PAINEL_SENHA)
//
// /api/contato
//   GET  -> { siteKey, ativo } para o formulário montar o Turnstile
//   POST -> valida, confere o Turnstile e envia o e-mail pelo Resend
//
// Variáveis (segredos, com "npx wrangler secret put NOME"; em desenvolvimento, no arquivo .dev.vars):
//   TURNSTILE_SITE_KEY, TURNSTILE_SECRET  anti-spam
//   RESEND_API_KEY                        envio de e-mail
//   CONTATO_PARA                          e-mail da Dilce que recebe as mensagens
//   CONTATO_DE                            remetente verificado no Resend (ex.: Site Laranjeira Atelier <site@laranjeiraatelier.com.br>)
// Sem RESEND_API_KEY, CONTATO_PARA ou CONTATO_DE, o formulário funciona em MODO DE TESTE:
// valida tudo, mas não envia, e avisa isso na tela.
import { validar } from "./contato";
import { comprar, painel, registrar, type EnvMetricas } from "./metricas";

type Env = EnvMetricas & {
  ASSETS: { fetch(req: Request): Promise<Response> };
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET?: string;
  RESEND_API_KEY?: string;
  CONTATO_PARA?: string;
  CONTATO_DE?: string;
};

const json = (dados: unknown, status = 200) =>
  new Response(JSON.stringify(dados), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
  });

const envioAtivo = (env: Env) => Boolean(env.RESEND_API_KEY && env.CONTATO_PARA && env.CONTATO_DE);

async function turnstileOk(env: Env, token: string, ip: string | null) {
  if (!env.TURNSTILE_SECRET) return false;
  const corpo = new FormData();
  corpo.append("secret", env.TURNSTILE_SECRET);
  corpo.append("response", token);
  if (ip) corpo.append("remoteip", ip);
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: corpo });
  const d = (await r.json()) as { success?: boolean };
  return d.success === true;
}

async function contato(req: Request, env: Env): Promise<Response> {
  if (req.method === "GET") return json({ siteKey: env.TURNSTILE_SITE_KEY ?? null, ativo: envioAtivo(env) });
  if (req.method !== "POST") return json({ ok: false, erros: { geral: "Método não permitido." } }, 405);

  let entrada: Record<string, unknown>;
  try {
    entrada = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, erros: { geral: "Não foi possível ler a mensagem. Tente de novo." } }, 400);
  }

  // Campo escondido (honeypot): pessoas não preenchem; robôs costumam preencher.
  // Fingimos sucesso para o robô não tentar de novo.
  if (typeof entrada.site === "string" && entrada.site.trim()) return json({ ok: true });

  const v = validar(entrada);
  if (!v.ok) return json({ ok: false, erros: v.erros }, 422);

  const token = typeof entrada.turnstile === "string" ? entrada.turnstile : "";
  if (!token || !(await turnstileOk(env, token, req.headers.get("cf-connecting-ip")))) {
    return json({ ok: false, erros: { geral: "Não conseguimos confirmar que você não é um robô. Recarregue a página e tente de novo." } }, 403);
  }

  if (!envioAtivo(env)) {
    console.log("[contato] modo de teste: mensagem validada e não enviada", { assunto: v.dados.assunto });
    registrar(env, "contato", v.dados.assunto, "teste");
    return json({ ok: true, teste: true });
  }

  const { nome, email, assunto, mensagem } = v.dados;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: env.CONTATO_DE,
      to: [env.CONTATO_PARA],
      reply_to: email,
      subject: `[Site] ${assunto}: ${nome}`,
      text: `Nome: ${nome}\nE-mail: ${email}\nAssunto: ${assunto}\n\n${mensagem}\n\n—\nEnviado pelo formulário de contato do site Laranjeira Atelier.`,
    }),
  });
  if (!r.ok) {
    console.error("[contato] Resend respondeu", r.status, await r.text());
    return json({ ok: false, erros: { geral: "Não foi possível enviar agora. Tente de novo em alguns minutos ou escreva direto para o e-mail da página." } }, 502);
  }
  registrar(env, "contato", assunto, "enviado");
  return json({ ok: true });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/api/contato" || url.pathname === "/api/contato/") return contato(req, env);
    if (url.pathname.startsWith("/api/")) return json({ ok: false }, 404);
    const compra = url.pathname.match(/^\/comprar\/([a-z0-9-]+)\/?$/);
    if (compra) return comprar(req, env, compra[1]);
    if (url.pathname === "/painel" || url.pathname === "/painel/") return painel(req, env);
    return env.ASSETS.fetch(req);
  },
};
