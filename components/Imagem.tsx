import { srcPadrao, srcSet, type ImagemInfo } from "@/lib/imagem";

type Props = {
  img: ImagemInfo;
  /** Largura que a imagem ocupa na tela, ex.: "(min-width: 768px) 50vw, 100vw" */
  sizes: string;
  /** true para imagens da primeira tela: carrega na hora, sem lazy loading */
  prioridade?: boolean;
  className?: string;
  /** limita o srcset (ex.: 960 nas miniaturas do portfólio: 480px ou 960px em telas densas) */
  maxLargura?: number;
};

// <img> com srcset, dimensões (sem pulo de layout), lazy loading e placeholder borrado.
// O alt vem obrigatório de ImagemInfo (validado pelo zod no conteúdo).
export function Imagem({ img: original, sizes, prioridade = false, className = "", maxLargura }: Props) {
  const permitidas = maxLargura ? original.larguras.filter((l) => l <= maxLargura) : original.larguras;
  const img = { ...original, larguras: permitidas.length ? permitidas : original.larguras.slice(0, 1) };
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
