"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type ItemMenu = { href: string; rotulo: string };

const ativo = (pathname: string, href: string) => pathname === href || pathname.startsWith(href);

function Links({ itens, pathname, vertical }: { itens: ItemMenu[]; pathname: string; vertical?: boolean }) {
  return (
    <ul className={vertical ? "flex flex-col gap-1" : "flex items-center gap-7"}>
      {itens.map((item) => {
        const atual = ativo(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={atual ? "page" : undefined}
              className={`block py-2 text-[17px] text-ink no-underline decoration-laranja decoration-[3px] underline-offset-8 hover:underline ${atual ? "underline" : ""}`}
            >
              {item.rotulo}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// Menu do cabeçalho: links no computador; no celular, botão que abre um painel.
export function Menu({ itens, compra }: { itens: ItemMenu[]; compra: React.ReactNode }) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const botao = useRef<HTMLButtonElement>(null);
  const painel = useRef<HTMLElement>(null);

  useEffect(() => setAberto(false), [pathname]);

  useEffect(() => {
    if (!aberto) return;
    // Esc fecha e devolve o foco ao botão; Tab circula entre o botão e os links do painel.
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAberto(false);
        botao.current?.focus();
      }
      if (e.key !== "Tab" || !painel.current || !botao.current) return;
      const focaveis = [botao.current, ...painel.current.querySelectorAll<HTMLElement>("a[href], button")];
      const atual = focaveis.indexOf(document.activeElement as HTMLElement);
      const proximo = atual === -1 ? 0 : (atual + (e.shiftKey ? -1 : 1) + focaveis.length) % focaveis.length;
      e.preventDefault();
      focaveis[proximo].focus();
    };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [aberto]);

  return (
    <>
      <nav aria-label="Principal" className="hidden items-center gap-8 lg:flex">
        <Links itens={itens} pathname={pathname} />
        {compra}
      </nav>

      <button
        ref={botao}
        type="button"
        className="inline-flex items-center gap-2 rounded-full border-2 border-ink px-4 py-2 text-[16px] font-bold lg:hidden"
        aria-expanded={aberto}
        aria-controls="menu-celular"
        onClick={() => setAberto((a) => !a)}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          {aberto ? (
            <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="2" />
          ) : (
            <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="2" />
          )}
        </svg>
        {aberto ? "Fechar" : "Menu"}
      </button>

      <nav
        ref={painel}
        id="menu-celular"
        aria-label="Principal"
        hidden={!aberto}
        className="absolute inset-x-0 top-full border-t border-linha bg-areia px-5 pb-6 pt-2 shadow-[0_12px_24px_rgba(42,38,32,0.12)] lg:hidden"
      >
        <Links itens={itens} pathname={pathname} vertical />
        <div className="mt-4">{compra}</div>
      </nav>
    </>
  );
}
