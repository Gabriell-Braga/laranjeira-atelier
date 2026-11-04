import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Faixa, FichaTecnica, Paragrafos } from "@/components/Blocos";
import { Botao } from "@/components/Botao";
import { CartaoLivro } from "@/components/CartaoLivro";
import { Galeria } from "@/components/Galeria";
import { imagensDoLivro, lerLivro, lerLivros, lerSite, paraGaleria } from "@/lib/conteudo";
import { livroLd } from "@/lib/dados-estruturados";
import { JsonLd, metadados } from "@/lib/meta";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return lerLivros().map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const livro = lerLivro((await params).slug)!;
  return metadados({
    titulo: livro.seoTitulo,
    absoluto: true,
    descricao: livro.seoDescricao,
    caminho: `/livros/${livro.slug}/`,
    imagem: `/og/livro-${livro.slug}.jpg`,
    tipo: "book",
  });
}

export default async function PaginaLivro({ params }: Props) {
  const livro = lerLivro((await params).slug);
  if (!livro) notFound();
  const site = lerSite();
  const amazon = site.amazon[livro.slug];
  const outros = lerLivros().filter((l) => l.slug !== livro.slug && (livro.slug === "colecao-sertao-vivo" || l.slug !== "colecao-sertao-vivo"));

  return (
    <>
      <JsonLd dados={livroLd(livro, site)} />
      <div className="conteudo grid gap-10 pb-14 pt-10 md:grid-cols-2 md:gap-14 md:pb-[88px] md:pt-16">
        <section aria-label="Imagens do livro">
          <Galeria variante="livro" imagens={imagensDoLivro(livro).map(paraGaleria)} />
        </section>
        <div>
          <p className="sobretitulo">
            {livro.volume} · {livro.paginas} páginas
          </p>
          <h1 className="titulo-display mt-3">{livro.titulo}</h1>
          <p className="mt-3 font-display text-[24px] italic leading-snug md:text-[28px]">{livro.subtitulo}</p>
          <p className="mt-4 text-ink-muted">{livro.autora}</p>
          {amazon && (
            <Botao href={amazon} variante="vereda" className="mt-8" aria-label={`Comprar na Amazon: ${livro.titulo} (abre em nova aba)`}>
              Comprar na Amazon
            </Botao>
          )}
          <Paragrafos textos={livro.descricao} className="leitura mt-10" />
          <h2 className="titulo-3 mt-12">Ficha técnica</h2>
          <FichaTecnica livro={livro} className="mt-4" />
        </div>
      </div>

      <Faixa className="border-t border-linha bg-surface" rotulo="titulo-outros">
        <h2 id="titulo-outros" className="titulo-2">
          {livro.slug === "colecao-sertao-vivo" ? "Os volumes da coleção" : "Outros livros da coleção"}
        </h2>
        <ul className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {outros.map((l) => (
            <li key={l.slug}>
              <CartaoLivro livro={l} amazon={site.amazon[l.slug]} />
            </li>
          ))}
        </ul>
      </Faixa>
    </>
  );
}
