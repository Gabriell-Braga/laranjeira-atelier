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
};

// Miniaturas que abrem no lightbox. A URL ganha ?imagem=slug enquanto ele está aberto,
// e abrir a página com esse parâmetro já mostra a imagem.
export function Galeria({
  imagens,
  variante = "grade",
  sizes = "(min-width: 768px) 25vw, 50vw",
  grade = "grid-cols-2 md:grid-cols-4",
}: Props) {
  const [indice, setIndice] = useState(-1);
  const ultimo = useRef(-1); // última imagem vista: recebe o foco quando o lightbox fecha
  const lista = useRef<HTMLUListElement>(null);
  const arrasto = useRef({ x: 0, inicio: 0, moveu: false });

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
        className="obra relative block w-full cursor-zoom-in rounded-[4px]"
        aria-label={`Ampliar: ${img.titulo ?? img.alt}`}
      >
        <Imagem img={img} sizes={tamanho} prioridade={prioridade} className="w-full" />
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
        <ul ref={lista} className="faixa-rolagem list-none" aria-label="Imagens (role para o lado)" {...arrastar}>
          {imagens.map((img, i) => miniatura(img, i, sizes))}
        </ul>
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
