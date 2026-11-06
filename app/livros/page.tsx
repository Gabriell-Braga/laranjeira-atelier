import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { metadados } from "@/lib/meta";
import { Citacao, Faixa, FichaTecnica, Texto } from "@/components/Blocos";
import { Botao } from "@/components/Botao";
import { CartaoLivro } from "@/components/CartaoLivro";
import { Galeria } from "@/components/Galeria";
import { Imagem } from "@/components/Imagem";
import { info, lerLivros, lerPagina, lerSite, paraGaleria } from "@/lib/conteudo";

// "Sobre a coleção": apresentação do projeto, os quatro volumes e a compra da coleção.
const pagina = lerPagina("livros");

export const metadata: Metadata = metadados({ titulo: pagina.campo("titulo"), descricao: pagina.campo("descricao"), caminho: "/livros/", imagem: "/og/livros.jpg" });

// Posição de cada capa no leque: esquerda (%), topo (%), giro (graus)
const LEQUE = [
  [0, 14, -8],
  [19, 4, -3],
  [38.5, 7, 3],
  [58, 0, 8],
] as const;

export default function Colecao() {
  const site = lerSite();
  const c = pagina.campo;
  const livros = lerLivros();
  const colecao = livros.find((l) => l.slug === "colecao-sertao-vivo")!;
  const volumes = livros.filter((l) => l !== colecao);
  const pranchas = pagina.imagens("pranchas").map(paraGaleria);
  // Trechos do texto separados por *** no markdown
  const [contexto, vive, ave, producao, objetivos] = pagina.html.split(/<hr\s*\/?>/);
  const ficha = (rotulo: string) => colecao.ficha.find((f) => f.rotulo === rotulo)?.valor ?? "";
  // Números da ficha técnica da coleção (content/livros/colecao-sertao-vivo.json)
  const numeros: [string, string][] = [
    [String(volumes.length), "volumes"],
    [String(colecao.paginas), "páginas"],
    [ficha("Imagens").replace(/^Mais de /, "+"), "imagens"],
    [String(ficha("Ilustrações").split(/, | e /).length), ficha("Ilustrações").toLowerCase()],
  ];

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
            <Botao href="#volumes">Conhecer os livros</Botao>
            <Botao href={site.amazon[colecao.slug]} variante="texto" aria-label="Comprar a coleção na Amazon (abre em nova aba)">
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

      {/* Introdução de Vive, Sertão! ao lado das suas pranchas */}
      <section className="faixa border-t border-linha bg-surface" aria-label="Introdução de Vive, Sertão!">
        <div className="conteudo grid items-center gap-14 lg:grid-cols-[minmax(0,62ch)_1fr] lg:gap-20">
          <Texto html={vive} className="revelar" />
          <Galeria imagens={pranchas.slice(2, 4)} grade="grid-cols-2 gap-4 lg:grid-cols-1 lg:gap-6" sizes="(min-width: 1024px) 480px, 45vw" />
        </div>
      </section>

      {/* Contexto curto antes da compra: uma frase da autora e os números da coleção */}
      <section className="faixa border-t border-linha" aria-label="Sobre o projeto">
        <div className="conteudo">
          <figure className="revelar mx-auto max-w-[46rem] text-center">
            <Texto html={contexto} className="contexto" />
            <figcaption className="mt-5 text-[15px] tracking-wide text-ink-muted">Dilce Laranjeira</figcaption>
          </figure>
          <ul className="numeros mx-auto mt-[var(--espaco-bloco)] grid max-w-[60rem] grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
            {numeros.map(([n, rotulo], i) => (
              <li key={rotulo} className="revelar" style={{ "--i": i } as CSSProperties}>
                <span className="numero">{n}</span>
                <span className="mt-2 block text-[15px] text-ink-muted">{rotulo}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Faixa rotulo="titulo-compra" className="border-t border-linha">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Imagem
            img={info(colecao.capa.arquivo, colecao.capa.alt)}
            sizes="(min-width: 1264px) 560px, (min-width: 768px) 45vw, 100vw"
            className="revelar mx-auto w-full max-w-[460px]"
          />
          <div>
            <h2 id="titulo-compra" className="titulo-2">{c("compraTitulo")}</h2>
            <p className="mt-4">{c("compraTexto")}</p>
            <div className="acoes mt-8">
              <Botao href={site.amazon[colecao.slug]} variante="vereda" aria-label="Comprar a coleção na Amazon (abre em nova aba)">
                Comprar a coleção
              </Botao>
              <Botao href={`/livros/${colecao.slug}/`} variante="texto">Ver detalhes</Botao>
            </div>
            <h3 className="titulo-3 mt-12">{c("fichaTitulo")}</h3>
            <FichaTecnica livro={colecao} className="mt-4" />
          </div>
        </div>
      </Faixa>

      <section className="faixa border-t border-linha bg-surface" aria-label="Introdução de Ave, Sertão!">
        <div className="conteudo grid items-center gap-14 lg:grid-cols-[1fr_minmax(0,62ch)] lg:gap-20">
          <div className="order-last lg:order-first">
            <Galeria imagens={pranchas.slice(0, 2)} grade="grid-cols-2 gap-4 lg:grid-cols-1 lg:gap-6" sizes="(min-width: 1024px) 480px, 45vw" />
          </div>
          <Texto html={ave} className="revelar" />
        </div>
      </section>

      <Citacao texto={c("citacao")} fonte={c("citacaoFonte")} />

      <Faixa rotulo="volumes">
        <h2 id="volumes" className="titulo-2 revelar scroll-mt-28">{c("colecaoTitulo")}</h2>
        <ul className="mt-[var(--espaco-bloco)] grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {volumes.map((l) => (
            <li key={l.slug} className="revelar">
              <CartaoLivro livro={l} amazon={site.amazon[l.slug]} />
            </li>
          ))}
        </ul>
        <Texto html={producao} className="leitura revelar mt-[var(--espaco-bloco)]" />
      </Faixa>

      {/* Objetivos fechados por padrão: a página fica leve, quem quiser abre */}
      <section className="faixa border-t border-linha bg-surface" aria-labelledby="titulo-objetivos">
        <div className="conteudo">
          <h2 id="titulo-objetivos" className="titulo-2 revelar">{c("objetivosTitulo")}</h2>
          <details className="objetivos revelar mt-6">
            <summary className="link-seta cursor-pointer py-2">{c("objetivosAbrir")}</summary>
            <Texto html={objetivos} />
          </details>
        </div>
      </section>

      <section className="faixa border-t border-linha" aria-labelledby="titulo-pranchas">
        <div className="conteudo revelar">
          <h2 id="titulo-pranchas" className="titulo-2">{c("pranchasTitulo")}</h2>
        </div>
        <div className="mt-[var(--espaco-bloco)]">
          <Galeria variante="faixa" imagens={pranchas.slice(4)} sizes="(min-width: 768px) 520px, 82vw" />
        </div>
      </section>
    </>
  );
}
