import type { Metadata } from "next";
import { metadados } from "@/lib/meta";
import { Texto, Marcado } from "@/components/Blocos";
import { Portfolio } from "@/components/Portfolio";
import { indicePortfolio, lerPagina, lerPortfolio } from "@/lib/conteudo";
import { TIPOS } from "@/lib/portfolio-dados";
import { POR_LEVA } from "@/lib/portfolio-indice";

const pagina = lerPagina("portfolio");

export const metadata: Metadata = metadados({ titulo: pagina.campo("titulo"), descricao: pagina.campo("descricao"), caminho: "/portfolio/" });

export default function PaginaPortfolio() {
  const indice = indicePortfolio();
  const { series } = lerPortfolio();
  const presentes = (valor: string) => indice.some((i) => i.tipo === valor);

  return (
    <>
      <div className="entrada conteudo pb-6 pt-8 md:pb-10 md:pt-14">
        <h1 className="titulo-display"><Marcado texto={pagina.campo("titulo")} /></h1>
        <Texto html={pagina.html} className="leitura mt-4 text-ink-muted" />
      </div>

      <section className="pb-[var(--espaco-secao)]" aria-label="Trabalhos">
        <Portfolio
          inicial={indice.slice(0, POR_LEVA)}
          total={indice.length}
          tipos={Object.entries(TIPOS)
            .filter(([v]) => presentes(v))
            .map(([valor, rotulo]) => ({ valor, rotulo }))}
          // Séries que são a única do seu tipo (ex.: Coleção Sertão Vivo = Livros autorais) repetiriam a categoria.
          series={series
            .filter((s) => indice.some((i) => i.serie === s.slug))
            .filter((s, _, todas) => todas.filter((o) => o.tipo === s.tipo && indice.some((i) => i.serie === o.slug)).length > 1)
            .map((s) => ({ valor: s.slug, rotulo: s.titulo, tipo: s.tipo }))}
        />
      </section>

    </>
  );
}
