import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { metadados } from "@/lib/meta";
import { Texto } from "@/components/Blocos";
import { Botao } from "@/components/Botao";
import { Galeria } from "@/components/Galeria";
import { Imagem } from "@/components/Imagem";
import { info, lerLivros, lerPagina, lerSite, paraGaleria } from "@/lib/conteudo";

const pagina = lerPagina("projeto");

export const metadata: Metadata = metadados({ titulo: pagina.campo("titulo"), descricao: pagina.campo("descricao"), caminho: "/projeto/", tipo: "article" });

// Posição de cada capa no leque: esquerda (%), topo (%), giro (graus)
const LEQUE = [
  [0, 14, -8],
  [19, 4, -3],
  [38.5, 7, 3],
  [58, 0, 8],
] as const;

export default function Projeto() {
  const site = lerSite();
  const c = pagina.campo;
  const volumes = lerLivros().filter((l) => l.slug !== "colecao-sertao-vivo");
  const pranchas = pagina.imagens("pranchas").map(paraGaleria);
  const [lateral, resto] = [pranchas.slice(0, 2), pranchas.slice(2)];

  return (
    <>
      {/* Destaque: as quatro capas abertas em leque, entrando uma a uma */}
      <header className="conteudo topo grid items-center gap-12 pb-[var(--espaco-secao)] lg:grid-cols-[5fr_6fr] lg:gap-16">
        <div>
          <p className="sobretitulo entrar">{c("sobretitulo")}</p>
          <h1 className="titulo-display entrar mt-5" style={{ "--i": 1 } as CSSProperties}>
            {c("titulo")}
          </h1>
          <p className="entrar mt-6 max-w-[34rem] text-[clamp(1.125rem,1.05rem+0.4vw,1.3rem)] leading-relaxed text-ink-muted" style={{ "--i": 2 } as CSSProperties}>
            {lerPagina("inicio").campo("colecaoTexto")}
          </p>
          <div className="acoes entrar mt-9" style={{ "--i": 3 } as CSSProperties}>
            <Botao href="/livros/">Conhecer os livros</Botao>
            <Botao href={site.amazon["colecao-sertao-vivo"]} variante="texto" aria-label="Comprar a coleção na Amazon (abre em nova aba)">
              Comprar a coleção
            </Botao>
          </div>
        </div>

        <ul className="leque relative mx-auto aspect-[16/11] w-full max-w-[660px] list-none p-0" aria-label="Os quatro volumes">
          {volumes.map((l, i) => {
            const [esq, topo, giro] = LEQUE[i];
            return (
              <li
                key={l.slug}
                className="leque-item entrar absolute w-[42%]"
                style={{ left: `${esq}%`, top: `${topo}%`, zIndex: i + 1, "--i": 2 + i * 1.3, "--giro": `${giro}deg`, "--abre": `${(i - 1.5) * 14}px` } as CSSProperties}
              >
                <Link href={`/livros/${l.slug}/`} className="leque-capa block" aria-label={`${l.titulo}: ${l.subtitulo}`}>
                  <Imagem
                    img={info(l.capa.arquivo, l.capa.alt)}
                    sizes="(min-width: 1024px) 270px, 44vw"
                    prioridade
                    maxLargura={720}
                    className="w-full"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </header>

      {/* Texto com pranchas presas ao lado enquanto se lê */}
      <article className="faixa border-t border-linha bg-surface">
        <div className="conteudo grid gap-14 lg:grid-cols-[minmax(0,62ch)_1fr] lg:gap-20">
          <Texto html={pagina.html} className="revelar" />
          <aside aria-label="Pranchas dos livros" className="lg:sticky lg:top-28 lg:self-start">
            <Galeria imagens={lateral} grade="grid-cols-2 gap-4 lg:grid-cols-1 lg:gap-6" sizes="(min-width: 1024px) 480px, 45vw" />
          </aside>
        </div>
      </article>

      <section className="faixa" aria-labelledby="titulo-pranchas">
        <div className="conteudo revelar">
          <h2 id="titulo-pranchas" className="titulo-2">{c("pranchasTitulo")}</h2>
        </div>
        <div className="mt-[var(--espaco-bloco)]">
          <Galeria variante="faixa" imagens={resto} sizes="(min-width: 768px) 520px, 82vw" />
        </div>
      </section>
    </>
  );
}
