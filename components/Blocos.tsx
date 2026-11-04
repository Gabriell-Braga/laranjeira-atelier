import type { ReactNode } from "react";
import type { Livro } from "@/lib/conteudo";
import { MOSTRAR_PENDENCIAS, pendente } from "@/lib/pendencias";
import { Pendente } from "./Pendente";

// Faixa com respiro vertical e conteúdo limitado a 1200px.
export function Faixa({ children, className = "", id, rotulo }: { children: ReactNode; className?: string; id?: string; rotulo?: string }) {
  return (
    <section id={id} aria-labelledby={rotulo} className={`faixa ${className}`}>
      <div className="conteudo">{children}</div>
    </section>
  );
}

// HTML vindo do markdown de content/paginas.
export function Texto({ html, className = "" }: { html: string; className?: string }) {
  return <div className={`texto ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

// Parágrafos de um campo de texto do conteúdo (some se estiver pendente em produção).
export function Paragrafos({ textos, className = "" }: { textos: string[]; className?: string }) {
  return (
    <div className={`texto ${className}`}>
      {textos.map((t) => (
        <Pendente key={t} valor={t}>
          <p>{t}</p>
        </Pendente>
      ))}
    </div>
  );
}

// Faixa escura da citação.
export function Citacao({ texto, fonte }: { texto: string; fonte: string }) {
  return (
    <section className="faixa bg-vereda text-paper">
      <figure className="conteudo">
        <blockquote className="citacao leitura">
          <p>“{texto}”</p>
        </blockquote>
        <figcaption className="mt-6 text-[16px]">{fonte}</figcaption>
      </figure>
    </section>
  );
}

// Ficha técnica de um livro.
export function FichaTecnica({ livro, className = "" }: { livro: Livro; className?: string }) {
  const linhas: [string, string][] = [
    ["Páginas", livro.slug === "colecao-sertao-vivo" ? `${livro.paginas} no total` : String(livro.paginas)],
    ["Formato", livro.formato],
    ["Encadernação", livro.encadernacao],
    ["ISBN", livro.isbn],
    ...livro.ficha.map((f): [string, string] => [f.rotulo, f.valor]),
  ];
  return (
    <dl className={`grid grid-cols-[minmax(7rem,14rem)_1fr] gap-x-6 border-t border-linha text-[16px] ${className}`}>
      {linhas
        .filter(([, valor]) => MOSTRAR_PENDENCIAS || !pendente(valor))
        .map(([rotulo, valor]) => (
          <div key={rotulo} className="contents">
            <dt className="border-b border-linha py-2.5 font-bold">{rotulo}</dt>
            <dd className="border-b border-linha py-2.5 text-ink-muted">
              {pendente(valor) ? <mark className="preencher">{valor}</mark> : valor}
            </dd>
          </div>
        ))}
    </dl>
  );
}
