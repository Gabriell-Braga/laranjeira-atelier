import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// "texto": link discreto com seta, para a ação secundária ao lado de um botão.
type Variante = "laranja" | "vereda" | "contorno" | "texto";

const estilos: Record<Variante, string> = {
  laranja: "botao bg-laranja text-ink hover:bg-laranja-claro active:bg-laranja-escuro",
  vereda: "botao bg-vereda text-paper hover:bg-vereda-claro active:bg-vereda-escuro",
  contorno: "botao border-2 border-vereda text-vereda hover:bg-vereda hover:text-paper active:bg-vereda-escuro",
  texto: "link-seta",
};

type Props = { variante?: Variante; children: ReactNode; className?: string; seta?: boolean } & (
  | ({ href: string } & Omit<ComponentProps<"a">, "href">)
  | ({ href?: undefined } & ComponentProps<"button">)
);

const Seta = () => (
  <svg className="seta" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M1.6 8.7c3.1-.6 6.6-1 11.3-.5M9 4.4c1.5 1.3 2.8 2.5 3.9 3.8-1.3 1-2.5 2.3-3.6 3.7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Botão em pílula. Com href vira link (externo abre em nova aba).
export function Botao({ variante = "laranja", className = "", children, seta = variante === "texto", ...resto }: Props) {
  const classes = `${estilos[variante]} ${className}`;
  const conteudo = (
    <>
      <span>{children}</span>
      {seta && <Seta />}
    </>
  );
  if (resto.href === undefined) {
    const props = resto as ComponentProps<"button">;
    return (
      <button type="button" {...props} className={classes}>
        {conteudo}
      </button>
    );
  }
  const { href, ...props } = resto as { href: string } & ComponentProps<"a">;
  // Externo: nova aba. Lojas (Amazon) com nofollow, para os buscadores não seguirem.
  if (/^https?:\/\//.test(href)) {
    const rel = /amazon\./.test(href) ? "noopener nofollow" : "noopener";
    return (
      <a href={href} target="_blank" rel={rel} {...props} className={classes}>
        {conteudo}
      </a>
    );
  }
  // Arquivo (PDF etc.): link comum, sem a navegação interna do Next.
  if (/\.[a-z0-9]+$/i.test(href)) {
    return (
      <a href={href} {...props} className={classes}>
        {conteudo}
      </a>
    );
  }
  return (
    <Link href={href} {...props} className={classes}>
      {conteudo}
    </Link>
  );
}
