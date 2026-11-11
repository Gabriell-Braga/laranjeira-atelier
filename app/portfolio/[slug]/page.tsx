import type { Metadata } from "next";
import { metadados } from "@/lib/meta";
import { notFound } from "next/navigation";
import { Botao } from "@/components/Botao";
import { Galeria } from "@/components/Galeria";
import { VoltarAoPortfolio } from "@/components/VoltarAoPortfolio";
import { lerLivro, lerPortfolio, paraGaleria, paraImagem } from "@/lib/conteudo";
import { TIPOS } from "@/lib/portfolio-dados";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

const projetos = () => lerPortfolio().series.filter((s) => s.pagina);

export function generateStaticParams() {
  return projetos().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = projetos().find((x) => x.slug === slug);
  return metadados({ titulo: s?.titulo ?? "Projeto", descricao: s?.texto, caminho: `/portfolio/${slug}/` });
}

export default async function Projeto({ params }: Props) {
  const { slug } = await params;
  const serie = projetos().find((s) => s.slug === slug);
  if (!serie) notFound();
  const itens = lerPortfolio().itens.filter((i) => i.serie === slug);
  const livro = lerLivro(slug); // projetos dos livros da coleção levam à página do livro
  const anos = [...new Set(itens.map((i) => i.ano).filter(Boolean))];

  return (
    <>
      <div className="entrada conteudo topo pb-10">
        <VoltarAoPortfolio />
        <p className="sobretitulo mt-6">
          {TIPOS[serie.tipo]} · Projeto{anos.length ? ` · ${anos.join(", ")}` : ""}
        </p>
        <h1 className="titulo-display mt-3">{serie.titulo}</h1>
        {serie.texto && <p className="leitura mt-6 text-ink-muted">{serie.texto}</p>}
      </div>
      <section className="conteudo pb-[var(--espaco-secao)]" aria-label="Imagens do projeto">
        <Galeria imagens={itens.map((i) => paraGaleria(paraImagem(i)))} grade="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw" />
        <div className="acoes mt-14">
          {livro ? (
            <Botao href={`/livros/${livro.slug}/`}>Ver o livro</Botao>
          ) : (
            <Botao href="/contato/">Fale comigo sobre um projeto</Botao>
          )}
          <Botao href="/portfolio/" variante="texto">Ver todo o portfólio</Botao>
        </div>
      </section>
    </>
  );
}
