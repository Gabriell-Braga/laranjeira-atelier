"use client";

import type React from "react";

import { useEffect, useRef, useState } from "react";
import type { ImagemGaleria } from "@/lib/imagem";
import { Imagem } from "./Imagem";
import { atualizarUrlImagem, slugDaUrl } from "@/lib/url-imagem";
import { VisualizadorSobDemanda as Visualizador } from "./VisualizadorSobDemanda";

type Props = {
  imagens: ImagemGaleria[];
  /**
   * "grade": miniaturas iguais. "livro": a primeira grande, as demais em miniatura.
   * "faixa": rolagem horizontal com encaixe, arrastável com o mouse.
   */
  variante?: "grade" | "livro" | "faixa";
  /** sizes das miniaturas */
  sizes?: string;
  /** classes da grade de miniaturas (variante "grade") */
  grade?: string;
  /** recorte igual para todas as miniaturas (ex.: "aspect-[4/5]"); o lightbox mostra a imagem inteira */
  recorte?: string;
};

// Miniaturas que abrem no lightbox. A URL ganha ?imagem=slug enquanto ele está aberto,
// e abrir a página com esse parâmetro já mostra a imagem.
export function Galeria({
  imagens,
  variante = "grade",
  sizes = "(min-width: 768px) 25vw, 50vw",
  grade = "grid-cols-2 md:grid-cols-4",
  recorte,
}: Props) {
  const [indice, setIndice] = useState(-1);
  const ultimo = useRef(-1); // última imagem vista: recebe o foco quando o lightbox fecha
  const lista = useRef<HTMLUListElement>(null);
  const arrasto = useRef({ x: 0, inicio: 0, moveu: false });

  // Faixa: progresso da rolagem (sem re-render) e setas que passam uma imagem por vez.
  const progresso = useRef<HTMLDivElement>(null);
  const atualizarProgresso = () => {
    const el = lista.current;
    if (!el || !progresso.current) return;
    const max = el.scrollWidth - el.clientWidth;
    const visivel = el.clientWidth / el.scrollWidth;
    const p = max > 0 ? el.scrollLeft / max : 1;
    progresso.current.style.transform = `scaleX(${visivel + (1 - visivel) * p})`;
    const botoes = el.parentElement?.querySelectorAll<HTMLButtonElement>(".seta-faixa");
    if (botoes) {
      botoes[0].disabled = el.scrollLeft <= 2;
      botoes[1].disabled = el.scrollLeft >= max - 2;
    }
  };
  useEffect(() => {
    if (variante !== "faixa") return;
    atualizarProgresso();
    window.addEventListener("resize", atualizarProgresso);
    return () => window.removeEventListener("resize", atualizarProgresso);
  });
  const passar = (dir: -1 | 1) => {
    const el = lista.current;
    const item = el?.firstElementChild as HTMLElement | null;
    if (!el || !item) return;
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * (item.offsetWidth + 20), behavior: reduzir ? "auto" : "smooth" });
  };

  // Faixa: arrastar com o mouse (no toque, a rolagem nativa já funciona).
  const arrastar = {
    onPointerDown: (e: React.PointerEvent<HTMLUListElement>) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      arrasto.current = { x: e.clientX, inicio: e.currentTarget.scrollLeft, moveu: false };
      const el = e.currentTarget;
      const mover = (ev: PointerEvent) => {
        const dx = ev.clientX - arrasto.current.x;
        if (Math.abs(dx) > 5) {
          arrasto.current.moveu = true;
          el.setAttribute("data-arrastando", "");
        }
        el.scrollLeft = arrasto.current.inicio - dx;
      };
      const soltar = () => {
        el.removeAttribute("data-arrastando");
        window.removeEventListener("pointermove", mover);
        window.removeEventListener("pointerup", soltar);
      };
      window.addEventListener("pointermove", mover);
      window.addEventListener("pointerup", soltar);
    },
    // depois de arrastar, o clique que vem junto não abre o lightbox
    onClickCapture: (e: React.MouseEvent) => {
      if (arrasto.current.moveu) {
        e.stopPropagation();
        e.preventDefault();
        arrasto.current.moveu = false;
      }
    },
    onDragStart: (e: React.DragEvent) => e.preventDefault(),
  };

  useEffect(() => {
    const slug = slugDaUrl();
    const i = slug ? imagens.findIndex((img) => img.slug === slug) : -1;
    if (i >= 0) setIndice(i);
  }, [imagens]);

  const abrir = (i: number) => {
    ultimo.current = i;
    setIndice(i);
    atualizarUrlImagem(imagens[i].slug);
  };

  const miniatura = (img: ImagemGaleria, i: number, tamanho: string, className = "", prioridade = false) => (
    <li key={img.slug} className={`${variante === "livro" ? "" : "revelar"} ${className}`} style={{ "--i": i % 4 } as React.CSSProperties}>
      <button
        type="button"
        data-indice={i}
        onClick={() => abrir(i)}
        className="obra relative block w-full cursor-pointer rounded-[4px]"
        aria-label={`Ampliar: ${img.titulo ?? img.alt}`}
      >
        <Imagem
          img={img}
          sizes={tamanho}
          prioridade={prioridade}
          // capa grande da página do livro: revelada como tinta, igual ao destaque da Início
          className={`${recorte ? `${recorte} object-cover` : ""} ${variante === "livro" && i === 0 ? "tinta" : ""} w-full`}
        />
      </button>
    </li>
  );

  return (
    <>
      {variante === "livro" ? (
        <ul ref={lista} className="grid list-none grid-cols-4 gap-3 p-0">
          {/* capa grande: primeira imagem da página, carrega sem esperar (LCP) */}
          {miniatura(imagens[0], 0, "(min-width: 1264px) 600px, (min-width: 768px) 50vw, calc(100vw - 40px)", "col-span-4", true)}
          {imagens.slice(1).map((img, i) => miniatura(img, i + 1, "(min-width: 768px) 12vw, 25vw"))}
        </ul>
      ) : variante === "faixa" ? (
        <>
          <ul ref={lista} className="faixa-rolagem list-none" aria-label="Imagens (role para o lado)" onScroll={atualizarProgresso} {...arrastar}>
            {imagens.map((img, i) => miniatura(img, i, sizes))}
          </ul>
          {/* Controles dentro da largura do conteúdo: linha de progresso e setas */}
          <div className="conteudo mt-6 flex items-center gap-6">
            <div className="h-px flex-1 bg-linha" aria-hidden="true">
              <div ref={progresso} className="faixa-progresso h-[2px] -translate-y-[0.5px] bg-ocre" />
            </div>
            <div className="flex gap-2">
              {([-1, 1] as const).map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => passar(dir)}
                  aria-label={dir < 0 ? "Imagens anteriores" : "Próximas imagens"}
                  className="seta-faixa grid h-11 w-11 place-items-center rounded-full border border-linha bg-surface text-vereda transition-[background-color,color,border-color,transform] duration-200 hover:border-vereda hover:bg-vereda hover:text-paper active:scale-95 disabled:pointer-events-none disabled:opacity-35"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className={dir < 0 ? "rotate-180" : ""}>
                    <path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <ul ref={lista} className={`grid list-none items-start gap-4 p-0 ${grade}`}>{imagens.map((img, i) => miniatura(img, i, sizes))}</ul>
      )}
      <Visualizador
        imagens={imagens}
        indice={indice}
        aoVer={(i) => {
          ultimo.current = i;
          setIndice(i);
        }}
        aoFechar={() => setIndice(-1)}
        aoSair={() => lista.current?.querySelector<HTMLElement>(`[data-indice="${ultimo.current}"]`)?.focus()}
      />
    </>
  );
}
