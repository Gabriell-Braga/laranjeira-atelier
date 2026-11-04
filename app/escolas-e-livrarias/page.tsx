import type { Metadata } from "next";
import { metadados } from "@/lib/meta";
import { Paragrafos, Texto } from "@/components/Blocos";
import { CartaoLivro } from "@/components/CartaoLivro";
import { FormularioContato } from "@/components/FormularioContato";
import { lerLivros, lerPagina, lerSite } from "@/lib/conteudo";

const pagina = lerPagina("escolas-e-livrarias");

export const metadata: Metadata = metadados({ titulo: pagina.campo("titulo"), descricao: pagina.campo("descricao"), caminho: "/escolas-e-livrarias/" });

export default function EscolasELivrarias() {
  const site = lerSite();
  const volumes = lerLivros().filter((l) => l.slug !== "colecao-sertao-vivo");
  const c = pagina.campo;
  return (
    <>
      <div className="conteudo pb-12 pt-10 md:pt-16">
        <p className="sobretitulo">{c("sobretitulo")}</p>
        <h1 className="titulo-display mt-3">{c("titulo")}</h1>
        <Texto html={pagina.html} className="leitura mt-6" />
        <Paragrafos textos={[c("condicoes")]} className="leitura mt-6" />
      </div>

      <section className="faixa border-t border-linha bg-surface" aria-label="Os volumes da coleção">
        <ul className="conteudo grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {volumes.map((l) => (
            <li key={l.slug}>
              <CartaoLivro livro={l} amazon={site.amazon[l.slug]} />
            </li>
          ))}
        </ul>
      </section>

      <section className="conteudo faixa" aria-labelledby="titulo-orcamento">
        <div className="max-w-[720px]">
          <h2 id="titulo-orcamento" className="titulo-2 mb-8">{c("formularioTitulo")}</h2>
          <FormularioContato assuntoInicial="Compra para escola ou livraria" />
        </div>
      </section>
    </>
  );
}
