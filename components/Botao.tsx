import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variante = "laranja" | "vereda" | "contorno";

const estilos: Record<Variante, string> = {
  laranja: "bg-laranja text-ink hover:bg-[#f39448]",
  vereda: "bg-vereda text-white hover:bg-[#3d5e37]",
  contorno: "border-2 border-vereda text-vereda hover:bg-vereda hover:text-white",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[17px] font-bold leading-tight no-underline transition-colors";

type Props = { variante?: Variante; children: ReactNode; className?: string } & (
  | ({ href: string } & Omit<ComponentProps<"a">, "href">)
  | ({ href?: undefined } & ComponentProps<"button">)
);

// Botão em pílula. Com href vira link (externo abre em nova aba).
export function Botao({ variante = "laranja", className = "", children, ...resto }: Props) {
  const classes = `${base} ${estilos[variante]} ${className}`;
  if (resto.href === undefined) {
    const props = resto as ComponentProps<"button">;
    return (
      <button type="button" {...props} className={classes}>
        {children}
      </button>
    );
  }
  const { href, ...props } = resto as { href: string } & ComponentProps<"a">;
  if (/^https?:\/\//.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener" {...props} className={classes}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} {...props} className={classes}>
      {children}
    </Link>
  );
}
