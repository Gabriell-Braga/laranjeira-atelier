import Link from "next/link";
import { info, type Livro } from "@/lib/conteudo";
import { Botao } from "./Botao";
import { Imagem } from "./Imagem";

type Props = {
  livro: Livro;
  amazon?: string;
  /** nível do título no contexto da página */
  nivel?: "h2" | "h3";
};

export function CartaoLivro({ livro, amazon, nivel: Titulo = "h3" }: Props) {
  const href = `/livros/${livro.slug}/`;
  return (
    <article className="flex h-full flex-col">
      <Link href={href} tabIndex={-1} aria-hidden="true" className="block">
        <Imagem
          img={info(livro.capa.arquivo, livro.capa.alt)}
          sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 100vw"
          className="w-full"
        />
      </Link>
      <p className="sobretitulo mt-5">
        {livro.volume} · {livro.paginas} páginas
      </p>
      <Titulo className="titulo-3 mt-1">
        <Link href={href} className="text-ink no-underline hover:underline">
          {livro.titulo}
        </Link>
      </Titulo>
      <p className="legenda mt-1 flex-1">{livro.subtitulo}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        {amazon && (
          <Botao href={amazon} variante="vereda" aria-label={`Comprar ${livro.titulo} na Amazon (abre em nova aba)`}>
            Comprar na Amazon
          </Botao>
        )}
        <Botao href={href} variante="contorno" aria-label={`Conhecer o livro ${livro.titulo}`}>
          Conhecer
        </Botao>
      </div>
    </article>
  );
}
