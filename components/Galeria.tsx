"use client";

import { useEffect, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { urlImagem, type ImagemGaleria } from "@/lib/imagem";
import { Imagem } from "./Imagem";

const ROTULOS = {
  Lightbox: "Visualizador de imagens",
  Carousel: "Carrossel",
  Slide: "Imagem",
  "Photo gallery": "Galeria de imagens",
  "{index} of {total}": "{index} de {total}",
  Previous: "Anterior",
  Next: "Próxima",
  Close: "Fechar",
  Loading: "Carregando",
  Error: "Não foi possível carregar a imagem",
  "Zoom in": "Ampliar",
  "Zoom out": "Reduzir",
  "Show thumbnails": "Mostrar miniaturas",
  "Hide thumbnails": "Esconder miniaturas",
  Thumbnails: "Miniaturas",
  Caption: "Legenda",
  "Show captions": "Mostrar legenda",
  "Hide captions": "Esconder legenda",
};

const ZOOM_MAXIMO = 3;
const FUNDO = "rgba(17, 24, 20, 0.96)"; // #111814 a 96%

function Legenda({ img }: { img: ImagemGaleria }) {
  const partes = [img.tecnica, img.origem, img.descricao].filter(Boolean);
  return (
    <>
      {img.cientifico && <i>{img.cientifico}</i>}
      {img.cientifico && " · "}
      {partes.join(" · ")}
      {partes.length > 0 && " · "}© Dilce Laranjeira
    </>
  );
}

function atualizarUrl(slug: string | null) {
  const url = new URL(window.location.href);
  if (slug) url.searchParams.set("imagem", slug);
  else url.searchParams.delete("imagem");
  window.history.replaceState(window.history.state, "", url);
}

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
    const slug = new URLSearchParams(window.location.search).get("imagem");
    const i = slug ? imagens.findIndex((img) => img.slug === slug) : -1;
    if (i >= 0) setIndice(i);
  }, [imagens]);

  // O Zoom da biblioteca limita pelo tamanho do arquivo (pixels × maxZoomPixelRatio).
  // Para o limite ser 3x do tamanho na tela, calculamos a razão para a imagem atual.
  const [razaoZoom, setRazaoZoom] = useState(1);
  useEffect(() => {
    if (indice < 0) return;
    const img = imagens[indice];
    const medir = () => {
      const slide = document.querySelector<HTMLElement>(".yarl__slide_current");
      if (!slide) return;
      const cs = getComputedStyle(slide);
      const w = slide.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const h = slide.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const exibida = Math.min(w, (h * img.largura) / img.altura, img.largura);
      setRazaoZoom((ZOOM_MAXIMO * exibida) / img.largura);
    };
    const quadro = requestAnimationFrame(medir);
    window.addEventListener("resize", medir);
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("resize", medir);
    };
  }, [indice, imagens]);

  const abrir = (i: number) => {
    setIndice(i);
    atualizarUrl(imagens[i].slug);
  };

  const slides = imagens.map((img) => ({
    src: urlImagem(img, img.larguras[img.larguras.length - 1]),
    width: img.largura,
    height: img.altura,
    alt: img.alt,
    title: img.titulo,
    description: <Legenda img={img} />,
    srcSet: img.larguras.map((l) => ({
      src: urlImagem(img, l),
      width: l,
      height: Math.round((img.altura * l) / img.largura),
    })),
  }));

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
        <ul className={`grid list-none items-start gap-4 p-0 ${grade}`}>
          {imagens.map((img, i) => miniatura(img, i, sizes))}
        </ul>
      )}

      <Lightbox
        open={indice >= 0}
        index={Math.max(indice, 0)}
        close={() => {
          setIndice(-1);
          atualizarUrl(null);
        }}
        on={{
          view: ({ index }) => {
            setIndice(index);
            atualizarUrl(imagens[index].slug);
          },
        }}
        slides={slides}
        plugins={[Captions, Counter, Thumbnails, Zoom]}
        labels={ROTULOS}
        // preload também define quantas miniaturas aparecem na faixa (2 × preload + 1).
        // Com 7 imagens ou menos o carrossel não dá a volta, senão a faixa repete miniaturas.
        carousel={{ preload: 3, finite: imagens.length <= 7 }}
        zoom={{ maxZoomPixelRatio: razaoZoom, scrollToZoom: true }}
        thumbnails={{ showToggle: true, vignette: false, border: 0, borderRadius: 4 }}
        captions={{ descriptionTextAlign: "start", descriptionMaxLines: 4 }}
        counter={{ separator: "/", container: { style: { top: "unset", bottom: 0, left: "auto", right: 0 } } }}
        styles={{ container: { backgroundColor: FUNDO }, thumbnailsContainer: { backgroundColor: FUNDO } }}
        render={imagens.length <= 1 ? { buttonPrev: () => null, buttonNext: () => null } : undefined}
      />
    </>
  );
}
