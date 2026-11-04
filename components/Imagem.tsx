import { srcPadrao, srcSet, type ImagemInfo } from "@/lib/imagem";

type Props = {
  img: ImagemInfo;
  /** Largura que a imagem ocupa na tela, ex.: "(min-width: 768px) 50vw, 100vw" */
  sizes: string;
  /** true para imagens da primeira tela: carrega na hora, sem lazy loading */
  prioridade?: boolean;
  className?: string;
};

// <img> com srcset, dimensões (sem pulo de layout), lazy loading e placeholder borrado.
// O alt vem obrigatório de ImagemInfo (validado pelo zod no conteúdo).
export function Imagem({ img, sizes, prioridade = false, className = "" }: Props) {
  return (
    <img
      src={srcPadrao(img)}
      srcSet={srcSet(img)}
      sizes={sizes}
      width={img.largura}
      height={img.altura}
      alt={img.alt}
      loading={prioridade ? "eager" : "lazy"}
      fetchPriority={prioridade ? "high" : undefined}
      decoding="async"
      className={`h-auto max-w-full ${className}`}
      style={
        img.placeholder
          ? { backgroundImage: `url(${img.placeholder})`, backgroundSize: "cover", backgroundColor: img.cor }
          : undefined
      }
    />
  );
}
