import Link from "next/link";
import type { ImagemInfo } from "@/lib/imagem";
import { Botao } from "./Botao";
import { Imagem } from "./Imagem";

type Props = {
  slug: string;
  volume: string;
  paginas: number;
  titulo: string;
  subtitulo: string;
  capa: ImagemInfo;
  amazon?: string;
};

export function CartaoLivro({ slug, volume, paginas, titulo, subtitulo, capa, amazon }: Props) {
  const href = `/livros/${slug}/`;
  return (
    <article className="flex h-full flex-col">
      <Link href={href} tabIndex={-1} aria-hidden="true" className="block">
        <Imagem img={capa} sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 100vw" className="w-full" />
      </Link>
      <p className="sobretitulo mt-5">
        {volume} · {paginas} páginas
      </p>
      <h3 className="titulo-3 mt-1">
        <Link href={href} className="text-ink no-underline hover:underline">
          {titulo}
        </Link>
      </h3>
      <p className="legenda mt-1 flex-1">{subtitulo}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        {amazon && (
          <Botao href={amazon} variante="vereda" aria-label={`Comprar ${titulo} na Amazon (abre em nova aba)`}>
            Comprar na Amazon
          </Botao>
        )}
        <Botao href={href} variante="contorno" aria-label={`Conhecer o livro ${titulo}`}>
          Conhecer
        </Botao>
      </div>
    </article>
  );
}
