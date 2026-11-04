"use client";

import { useEffect, useMemo, useState } from "react";
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
import { atualizarUrlImagem } from "@/lib/url-imagem";

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


type Props = {
  imagens: ImagemGaleria[];
  /** índice aberto; -1 = fechado */
  indice: number;
  /** chamado ao navegar dentro do lightbox */
  aoVer: (indice: number) => void;
  aoFechar: () => void;
  /** chamado quando a animação de fechar termina (bom momento para mover o foco) */
  aoSair?: () => void;
};

// Lightbox com zoom até 3x na tela, legenda, contador, miniaturas e ?imagem=slug na URL.
export function Visualizador({ imagens, indice, aoVer, aoFechar, aoSair }: Props) {
  // O Zoom da biblioteca limita pelo tamanho do arquivo (pixels × maxZoomPixelRatio).
  // Para o limite ser 3x do tamanho na tela, calculamos a razão para a imagem atual.
  const [razaoZoom, setRazaoZoom] = useState(1);
  useEffect(() => {
    if (indice < 0 || !imagens[indice]) return;
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

  const slides = useMemo(
    () =>
      imagens.map((img) => ({
        src: urlImagem(img, img.larguras[img.larguras.length - 1]),
        width: img.largura,
        height: img.altura,
        alt: img.alt,
        title: img.titulo,
        description: <Legenda img={img} />,
        srcSet: img.larguras.map((l) => ({ src: urlImagem(img, l), width: l, height: Math.round((img.altura * l) / img.largura) })),
      })),
    [imagens],
  );

  return (
    <Lightbox
      open={indice >= 0}
      index={Math.max(indice, 0)}
      close={() => {
        atualizarUrlImagem(null);
        aoFechar();
      }}
      on={{
        view: ({ index }) => {
          if (!imagens[index]) return;
          atualizarUrlImagem(imagens[index].slug);
          aoVer(index);
        },
        exited: () => aoSair?.(),
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
  );
}
