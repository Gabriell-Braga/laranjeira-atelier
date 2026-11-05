import type { Metadata } from "next";
import { metadados } from "@/lib/meta";
import { Citacao, Texto } from "@/components/Blocos";
import { Botao } from "@/components/Botao";
import { Galeria } from "@/components/Galeria";
import { lerPagina, lerSite, paraGaleria } from "@/lib/conteudo";

const pagina = lerPagina("projeto");

export const metadata: Metadata = metadados({ titulo: pagina.campo("titulo"), descricao: pagina.campo("descricao"), caminho: "/projeto/", tipo: "article" });

export default function Projeto() {
  const site = lerSite();
  const c = pagina.campo;
  return (
    <>
      <header className="conteudo topo pb-[var(--espaco-bloco)]">
        <p className="sobretitulo">{c("sobretitulo")}</p>
        <h1 className="titulo-display mt-4">{c("titulo")}</h1>
      </header>

      <Citacao texto={c("citacao")} fonte={c("citacaoFonte")} />

      <article className="conteudo faixa">
        <Texto html={pagina.html} className="leitura mx-auto" />
        <div className="acoes leitura mx-auto mt-12">
          <Botao href="/livros/">Conhecer os livros</Botao>
          <Botao href={site.amazon["colecao-sertao-vivo"]} variante="texto" aria-label="Comprar a coleção na Amazon (abre em nova aba)">
            Comprar a coleção
          </Botao>
        </div>
      </article>

      <section className="faixa border-t border-linha bg-surface" aria-labelledby="titulo-pranchas">
        <div className="conteudo">
          <h2 id="titulo-pranchas" className="titulo-2 revelar">{c("pranchasTitulo")}</h2>
          <div className="mt-[var(--espaco-bloco)]">
            <Galeria
              imagens={pagina.imagens("pranchas").map(paraGaleria)}
              grade="sm:grid-cols-2 lg:grid-cols-3 gap-6"
              sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
            />
          </div>
        </div>
      </section>
    </>
  );
}
