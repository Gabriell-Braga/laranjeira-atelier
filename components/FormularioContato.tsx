"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ASSUNTOS, validar, type Mensagem } from "@/lib/contato";

type Erros = Partial<Record<keyof Mensagem | "geral", string>>;
type Turnstile = {
  render: (el: HTMLElement, o: Record<string, unknown>) => string;
  reset: (id?: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

const SCRIPT_TURNSTILE = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function carregarTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  return new Promise((ok, erro) => {
    const s = document.createElement("script");
    s.src = SCRIPT_TURNSTILE;
    s.async = true;
    s.onload = () => (window.turnstile ? ok(window.turnstile) : erro(new Error("Turnstile indisponível")));
    s.onerror = () => erro(new Error("Turnstile indisponível"));
    document.head.appendChild(s);
  });
}

const campoBase =
  "mt-2 block w-full rounded-[4px] border-2 border-linha bg-surface px-4 py-3 text-[18px] text-ink aria-[invalid=true]:border-[#a3341f]";

export function FormularioContato({ assuntoInicial = "" }: { assuntoInicial?: string }) {
  const id = useId();
  const [valores, setValores] = useState<Mensagem>({ nome: "", email: "", assunto: assuntoInicial, mensagem: "" });
  const [erros, setErros] = useState<Erros>({});
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<null | { teste: boolean }>(null);
  const [config, setConfig] = useState<{ siteKey: string | null; ativo: boolean } | null>(null);
  const token = useRef("");
  const widget = useRef<string | undefined>(undefined);
  const caixaTurnstile = useRef<HTMLDivElement>(null);
  const sucesso = useRef<HTMLHeadingElement>(null);
  const resumoErros = useRef<HTMLDivElement>(null);

  // Busca a chave pública do Turnstile no Worker e monta o desafio.
  useEffect(() => {
    let cancelado = false;
    fetch("/api/contato/")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(async (c: { siteKey: string | null; ativo: boolean }) => {
        if (cancelado) return;
        setConfig(c);
        if (!c.siteKey || !caixaTurnstile.current) return;
        const t = await carregarTurnstile();
        widget.current = t.render(caixaTurnstile.current, {
          sitekey: c.siteKey,
          language: "pt-br",
          theme: "light", // o padrão segue o tema escuro do sistema e destoa da página clara
          callback: (v: string) => (token.current = v),
          "expired-callback": () => (token.current = ""),
        });
      })
      .catch(() => !cancelado && setConfig({ siteKey: null, ativo: false }));
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (resultado) sucesso.current?.focus();
  }, [resultado]);

  const mudar = (campo: keyof Mensagem) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setValores((v) => ({ ...v, [campo]: e.target.value }));
    if (erros[campo]) setErros((er) => ({ ...er, [campo]: undefined }));
  };

  const conferirCampo = (campo: keyof Mensagem) => () => {
    const r = validar(valores);
    setErros((er) => ({ ...er, [campo]: r.ok ? undefined : r.erros[campo] }));
  };

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const r = validar(valores);
    if (!r.ok) {
      setErros(r.erros);
      requestAnimationFrame(() => resumoErros.current?.focus());
      return;
    }
    if (!token.current) {
      setErros({ geral: "Confirme que você não é um robô (caixa acima do botão) e envie de novo." });
      requestAnimationFrame(() => resumoErros.current?.focus());
      return;
    }
    setEnviando(true);
    setErros({});
    try {
      const site = (e.currentTarget.elements.namedItem("site") as HTMLInputElement | null)?.value ?? "";
      const resp = await fetch("/api/contato/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...valores, site, turnstile: token.current }),
      });
      const d = (await resp.json()) as { ok: boolean; teste?: boolean; erros?: Erros };
      if (d.ok) setResultado({ teste: Boolean(d.teste) });
      else {
        setErros(d.erros ?? { geral: "Não foi possível enviar. Tente de novo." });
        requestAnimationFrame(() => resumoErros.current?.focus());
      }
    } catch {
      setErros({ geral: "Sem conexão com o servidor. Confira sua internet e tente de novo." });
      requestAnimationFrame(() => resumoErros.current?.focus());
    } finally {
      setEnviando(false);
      token.current = "";
      window.turnstile?.reset(widget.current);
    }
  }

  if (resultado) {
    return (
      <div className="rounded-[4px] border-2 border-vereda bg-surface p-6" role="status">
        <h2 ref={sucesso} tabIndex={-1} className="titulo-3 outline-none">
          Mensagem enviada. Obrigada!
        </h2>
        <p className="mt-3">Vou responder no e-mail {valores.email} assim que possível.</p>
        {resultado.teste && (
          <p className="mt-3 rounded-[4px] bg-areia px-4 py-3 text-[16px]">
            <strong>Formulário em teste:</strong> a mensagem foi conferida, mas ainda não é enviada por e-mail.
          </p>
        )}
      </div>
    );
  }

  const listaErros = Object.entries(erros).filter(([, v]) => v);
  const ajuda = (campo: keyof Mensagem) => (erros[campo] ? `${id}-${campo}-erro` : undefined);

  return (
    <form onSubmit={enviar} noValidate className="space-y-6">
      {config && !config.ativo && (
        <p className="rounded-[4px] bg-areia px-4 py-3 text-[16px]">
          <strong>Formulário em teste:</strong> as mensagens ainda não são enviadas por e-mail.
        </p>
      )}

      <div ref={resumoErros} tabIndex={-1} className="outline-none" aria-live="assertive">
        {listaErros.length > 0 && (
          <div className="rounded-[4px] border-2 border-[#a3341f] bg-surface p-4 text-[16px]" role="alert">
            <p className="font-bold">Confira {listaErros.length === 1 ? "o campo" : "os campos"} abaixo:</p>
            <ul className="mt-2 list-disc pl-5">
              {listaErros.map(([campo, msg]) => (
                <li key={campo}>{msg}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div>
        <label htmlFor={`${id}-nome`} className="font-bold">Nome</label>
        <input id={`${id}-nome`} name="nome" autoComplete="name" required value={valores.nome} onChange={mudar("nome")} onBlur={conferirCampo("nome")} aria-invalid={Boolean(erros.nome)} aria-describedby={ajuda("nome")} className={campoBase} />
        {erros.nome && <p id={`${id}-nome-erro`} className="mt-1 text-[16px] text-[#a3341f]">{erros.nome}</p>}
      </div>

      <div>
        <label htmlFor={`${id}-email`} className="font-bold">E-mail</label>
        <input id={`${id}-email`} name="email" type="email" autoComplete="email" inputMode="email" required value={valores.email} onChange={mudar("email")} onBlur={conferirCampo("email")} aria-invalid={Boolean(erros.email)} aria-describedby={ajuda("email")} className={campoBase} />
        {erros.email && <p id={`${id}-email-erro`} className="mt-1 text-[16px] text-[#a3341f]">{erros.email}</p>}
      </div>

      <div>
        <label htmlFor={`${id}-assunto`} className="font-bold">Assunto</label>
        <select id={`${id}-assunto`} name="assunto" required value={valores.assunto} onChange={mudar("assunto")} onBlur={conferirCampo("assunto")} aria-invalid={Boolean(erros.assunto)} aria-describedby={ajuda("assunto")} className={campoBase}>
          <option value="">Escolha um assunto</option>
          {ASSUNTOS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        {erros.assunto && <p id={`${id}-assunto-erro`} className="mt-1 text-[16px] text-[#a3341f]">{erros.assunto}</p>}
      </div>

      <div>
        <label htmlFor={`${id}-mensagem`} className="font-bold">Mensagem</label>
        <textarea id={`${id}-mensagem`} name="mensagem" rows={7} required value={valores.mensagem} onChange={mudar("mensagem")} onBlur={conferirCampo("mensagem")} aria-invalid={Boolean(erros.mensagem)} aria-describedby={ajuda("mensagem")} className={campoBase} />
        {erros.mensagem && <p id={`${id}-mensagem-erro`} className="mt-1 text-[16px] text-[#a3341f]">{erros.mensagem}</p>}
      </div>

      {/* Campo escondido contra robôs (honeypot): pessoas não veem nem preenchem. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-site`}>Não preencha este campo</label>
        <input id={`${id}-site`} name="site" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <div ref={caixaTurnstile} className="min-h-[65px]" />

      <button
        type="submit"
        disabled={enviando}
        className="inline-flex items-center justify-center rounded-full bg-laranja px-7 py-3 text-[17px] font-bold text-ink transition-colors duration-[400ms] hover:bg-[#f39448] disabled:opacity-60"
      >
        {enviando ? "Enviando…" : "Enviar mensagem"}
      </button>
      <p className="legenda">
        Seus dados são usados só para responder a esta mensagem. Veja a <a href="/privacidade/">política de privacidade</a>.
      </p>
    </form>
  );
}
