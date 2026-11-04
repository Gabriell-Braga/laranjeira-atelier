"use client";

import { useEffect, useState } from "react";
import type { ImagemGaleria } from "@/lib/imagem";
import { Imagem } from "./Imagem";
import { atualizarUrlImagem, slugDaUrl, Visualizador } from "./Visualizador";

type Props = {
  imagens: ImagemGaleria[];
  /** "grade": miniaturas iguais. "livro": a primeira grande, as demais em miniatura. */
  variante?: "grade" | "livro";
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

  useEffect(() => {
    const slug = slugDaUrl();
    const i = slug ? imagens.findIndex((img) => img.slug === slug) : -1;
    if (i >= 0) setIndice(i);
  }, [imagens]);

  const abrir = (i: number) => {
    setIndice(i);
    atualizarUrlImagem(imagens[i].slug);
  };

  const miniatura = (img: ImagemGaleria, i: number, tamanho: string, className = "") => (
    <li key={img.slug} className={className}>
      <button
        type="button"
        onClick={() => abrir(i)}
        className="block w-full cursor-zoom-in rounded-[4px]"
        aria-label={`Ampliar: ${img.titulo ?? img.alt}`}
      >
        <Imagem img={img} sizes={tamanho} className="w-full" />
      </button>
    </li>
  );

  return (
    <>
      {variante === "livro" ? (
        <ul className="grid list-none grid-cols-4 gap-3 p-0">
          {miniatura(imagens[0], 0, "(min-width: 768px) 50vw, 100vw", "col-span-4")}
          {imagens.slice(1).map((img, i) => miniatura(img, i + 1, "(min-width: 768px) 12vw, 25vw"))}
        </ul>
      ) : (
        <ul className={`grid list-none items-start gap-4 p-0 ${grade}`}>{imagens.map((img, i) => miniatura(img, i, sizes))}</ul>
      )}
      <Visualizador imagens={imagens} indice={indice} aoVer={setIndice} aoFechar={() => setIndice(-1)} />
    </>
  );
}
