"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const normal = (p: string) => p.replace(/\/+$/, "") || "/";

// Link do rodapé. Na página atual, fica marcado (pincelada fixa) e o clique sobe a página
// com suavidade, em vez de não fazer nada (o que gerava cliques repetidos de frustração).
export function LinkRodape({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const atual = normal(usePathname()) === normal(href);
  return (
    <Link
      href={href}
      className={className}
      aria-current={atual ? "page" : undefined}
      onClick={(e) => {
        if (!atual) return;
        e.preventDefault();
        const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduzir ? "auto" : "smooth" });
      }}
    >
      {children}
    </Link>
  );
}
