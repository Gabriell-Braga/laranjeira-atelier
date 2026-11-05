import Link from "next/link";
import { info, type Livro } from "@/lib/conteudo";
import { Botao } from "./Botao";
import { Imagem } from "./Imagem";

type Props = {
  livro: Livro;
  amazon?: string;
  /** nível do título no contexto da página */
  nivel?: "h2" | "h3";
  /** capa na primeira tela: carrega sem lazy loading */
  prioridade?: boolean;
};

// O cartão inteiro leva à página do livro (o link do título cobre o cartão);
// o único botão é o de compra, que fica por cima.
export function CartaoLivro({ livro, amazon, nivel: Titulo = "h3", prioridade }: Props) {
  const href = `/livros/${livro.slug}/`;
  return (
    <article className="cartao relative flex h-full flex-col">
      <div className="cartao-capa">
        <Imagem
          img={info(livro.capa.arquivo, livro.capa.alt)}
          sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, calc(100vw - 40px)"
          prioridade={prioridade}
          className="w-full rounded-none"
        />
      </div>
      <p className="sobretitulo mt-6">
        {livro.volume} · {livro.paginas} páginas
      </p>
      <Titulo className="titulo-3 mt-2">
        <Link href={href} className="text-ink no-underline after:absolute after:inset-0 after:rounded-[4px] hover:text-vereda">
          {livro.titulo}
        </Link>
      </Titulo>
      <p className="legenda mt-1 flex-1">{livro.subtitulo}</p>
      <div className="relative mt-5 flex items-center gap-4">
        {amazon ? (
          <Botao href={amazon} variante="vereda" aria-label={`Comprar na Amazon: ${livro.titulo} (abre em nova aba)`}>
            Comprar na Amazon
          </Botao>
        ) : (
          <span className="link-seta" aria-hidden="true">
            <span>Conhecer o livro</span>
          </span>
        )}
      </div>
    </article>
  );
}
