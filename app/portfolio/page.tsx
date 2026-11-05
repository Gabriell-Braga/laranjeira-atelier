import type { Metadata } from "next";
import { metadados } from "@/lib/meta";
import { Texto } from "@/components/Blocos";
import { Botao } from "@/components/Botao";
import { Portfolio } from "@/components/Portfolio";
import { indicePortfolio, lerPagina, lerPortfolio } from "@/lib/conteudo";
import { GRUPOS_TECNICA, TIPOS } from "@/lib/portfolio-dados";
import { POR_LEVA } from "@/lib/portfolio-indice";

const pagina = lerPagina("portfolio");

export const metadata: Metadata = metadados({ titulo: pagina.campo("titulo"), descricao: pagina.campo("descricao"), caminho: "/portfolio/" });

export default function PaginaPortfolio() {
  const indice = indicePortfolio();
  const { series } = lerPortfolio();
  const presentes = (valor: string, chave: "tipo" | "grupos") =>
    indice.some((i) => (chave === "tipo" ? i.tipo === valor : i.grupos.includes(valor)));

  return (
    <>
      <div className="conteudo pb-6 pt-8 md:pb-10 md:pt-14">
        <h1 className="titulo-display">{pagina.campo("titulo")}</h1>
        <Texto html={pagina.html} className="leitura mt-4 text-ink-muted" />
      </div>

      <section className="pb-[var(--espaco-secao)]" aria-label="Trabalhos">
        <Portfolio
          inicial={indice.slice(0, POR_LEVA)}
          total={indice.length}
          tipos={Object.entries(TIPOS)
            .filter(([v]) => presentes(v, "tipo"))
            .map(([valor, rotulo]) => ({ valor, rotulo }))}
          tecnicas={Object.entries(GRUPOS_TECNICA)
            .filter(([v]) => presentes(v, "grupos"))
            .map(([valor, rotulo]) => ({ valor, rotulo }))}
          // Séries que são a única do seu tipo (ex.: Coleção Sertão Vivo = Livros autorais) repetiriam a categoria.
          series={series
            .filter((s) => indice.some((i) => i.serie === s.slug))
            .filter((s, _, todas) => todas.filter((o) => o.tipo === s.tipo && indice.some((i) => i.serie === o.slug)).length > 1)
            .map((s) => ({ valor: s.slug, rotulo: s.titulo, tipo: s.tipo }))}
        />
      </section>

      <section className="faixa bg-areia" aria-labelledby="titulo-chamada">
        <div className="conteudo grid items-center gap-8 md:grid-cols-[3fr_2fr]">
          <div>
            <h2 id="titulo-chamada" className="titulo-2">{pagina.campo("chamadaTitulo")}</h2>
            <p className="leitura mt-4">{pagina.campo("chamadaTexto")}</p>
          </div>
          <div className="md:text-right">
            <Botao href="/contato/" variante="vereda" seta>Fale comigo</Botao>
          </div>
        </div>
      </section>
    </>
  );
}
