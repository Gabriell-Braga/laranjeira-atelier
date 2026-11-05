// Formulário de contato (Vercel Function).
//   GET  -> { siteKey, ativo } para o formulário montar o Turnstile
//   POST -> valida, confere o Turnstile e envia o e-mail pelo Resend
//
// Variáveis de ambiente (Vercel > Project > Settings > Environment Variables; no computador, .env.local):
//   TURNSTILE_SITE_KEY, TURNSTILE_SECRET  anti-spam (Cloudflare Turnstile, funciona fora do Cloudflare)
//   RESEND_API_KEY                        envio de e-mail
//   CONTATO_PARA                          e-mail da Dilce que recebe as mensagens
//   CONTATO_DE                            remetente verificado no Resend (ex.: Site Laranjeira Atelier <site@laranjeiraatelier.com.br>)
// Sem RESEND_API_KEY, CONTATO_PARA ou CONTATO_DE, o formulário funciona em MODO DE TESTE:
// valida tudo, mas não envia, e avisa isso na tela.
import { validar } from "@/lib/contato";

export const dynamic = "force-dynamic";

const env = process.env;

const json = (dados: unknown, status = 200) =>
  Response.json(dados, { status, headers: { "cache-control": "no-store", "x-robots-tag": "noindex" } });

const envioAtivo = () => Boolean(env.RESEND_API_KEY && env.CONTATO_PARA && env.CONTATO_DE);

async function turnstileOk(token: string, ip: string | null) {
  if (!env.TURNSTILE_SECRET) return false;
  const corpo = new FormData();
  corpo.append("secret", env.TURNSTILE_SECRET);
  corpo.append("response", token);
  if (ip) corpo.append("remoteip", ip);
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: corpo });
  const d = (await r.json()) as { success?: boolean };
  return d.success === true;
}

export function GET() {
  return json({ siteKey: env.TURNSTILE_SITE_KEY ?? null, ativo: envioAtivo() });
}

export async function POST(req: Request) {
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
  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
  if (!token || !(await turnstileOk(token, ip))) {
    return json({ ok: false, erros: { geral: "Não conseguimos confirmar que você não é um robô. Recarregue a página e tente de novo." } }, 403);
  }

  if (!envioAtivo()) {
    console.log("[contato] modo de teste: mensagem validada e não enviada", { assunto: v.dados.assunto });
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
  return json({ ok: true });
}
