import type { Metadata } from "next";
import { Fragment, type CSSProperties } from "react";
import { websiteEPessoa } from "@/lib/dados-estruturados";
import { JsonLd, metadados } from "@/lib/meta";
import { Citacao, Faixa, Texto } from "@/components/Blocos";
import { Botao } from "@/components/Botao";
import { CartaoLivro } from "@/components/CartaoLivro";
import { Galeria } from "@/components/Galeria";
import { Imagem } from "@/components/Imagem";
import { Pendente } from "@/components/Pendente";
import { info, lerLivros, lerPagina, lerSite, paraGaleria } from "@/lib/conteudo";
import { MOSTRAR_PENDENCIAS, pendente } from "@/lib/pendencias";

const pagina = lerPagina("inicio");

export const metadata: Metadata = metadados({ titulo: pagina.campo("titulo"), descricao: pagina.campo("descricao"), caminho: "/", absoluto: true });

type Depoimento = { texto: string; nome: string; papel: string };
const atraso = (i: number) => ({ "--i": i }) as CSSProperties;

export default function Inicio() {
  const site = lerSite();
  const livros = lerLivros();
  const volumes = livros.filter((l) => l.slug !== "colecao-sertao-vivo");
  const c = pagina.campo;
  const clientes = (pagina.dados.clientes as string[]) ?? [];
  const depoimentos = ((pagina.dados.depoimentos as Depoimento[]) ?? []).filter((d) => MOSTRAR_PENDENCIAS || !pendente(d.texto));
  const palavras = c("destaque").split(" ");

  return (
    <>
      <JsonLd dados={websiteEPessoa(site)} />
      {/* Destaque: título palavra por palavra, botões em seguida, ilustração revelada como tinta */}
      <section className="conteudo topo grid items-center gap-10 pb-[var(--espaco-secao)] lg:grid-cols-[5fr_6fr] lg:gap-16">
        <div>
          <p className="sobretitulo entrar">{c("destaqueSobretitulo")}</p>
          <h1 className="titulo-display mt-5">
            {palavras.map((p, i) => (
              <Fragment key={i}>
                <span className="entrar inline-block" style={atraso(i * 0.45)}>
                  {p}
                </span>{" "}
              </Fragment>
            ))}
          </h1>
          <div className="acoes mt-9">
            <Botao href="/livros/" className="entrar" style={atraso(palavras.length * 0.45 + 1)}>
              Conhecer a coleção
            </Botao>
            <Botao
              href={site.amazon["colecao-sertao-vivo"]}
              variante="texto"
              className="entrar"
              style={atraso(palavras.length * 0.45 + 2)}
              aria-label="Comprar a coleção na Amazon (abre em nova aba)"
            >
              Comprar na Amazon
            </Botao>
          </div>
        </div>
        <div className="destaque-tela overflow-hidden rounded-[4px]">
          <div data-parallax="0.06">
            <Imagem
              img={info(c("imagemDestaque"), c("imagemDestaqueAlt"))}
              sizes="(min-width: 1264px) 660px, (min-width: 1024px) 52vw, calc(100vw - 40px)"
              prioridade
              className="tinta w-full"
            />
          </div>
        </div>
      </section>

      {/* A coleção */}
      <Faixa className="border-t border-linha bg-surface" rotulo="titulo-colecao">
        <div className="revelar flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <div className="max-w-[38rem]">
            <h2 id="titulo-colecao" className="titulo-2">{c("colecaoTitulo")}</h2>
            <p className="mt-4 text-ink-muted">{c("colecaoTexto")}</p>
          </div>
          <Botao href="/livros/" variante="texto">Ver a coleção</Botao>
        </div>
        <ul className="mt-[var(--espaco-bloco)] grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {volumes.map((l, i) => (
            <li key={l.slug} className="revelar" style={atraso(i)}>
              <CartaoLivro livro={l} amazon={site.amazon[l.slug]} />
            </li>
          ))}
        </ul>
      </Faixa>

      {/* Por dentro dos livros: faixa que rola para o lado */}
      <section className="faixa" aria-labelledby="titulo-pranchas">
        <div className="conteudo revelar">
          <h2 id="titulo-pranchas" className="titulo-2">{c("pranchasTitulo")}</h2>
          <p className="leitura mt-4 text-ink-muted">{c("pranchasTexto")}</p>
        </div>
        <div className="mt-[var(--espaco-bloco)]">
          <Galeria
            variante="faixa"
            imagens={pagina.imagens("pranchas").map(paraGaleria)}
            sizes="(min-width: 768px) 520px, 82vw"
          />
        </div>
      </section>

      <Citacao texto={c("citacao")} fonte={c("citacaoFonte")} />

      {/* Ilustração e design */}
      <Faixa rotulo="titulo-ilustracao">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="revelar">
            <h2 id="titulo-ilustracao" className="titulo-2">{c("ilustracaoTitulo")}</h2>
            <Texto html={pagina.html} className="leitura mt-6" />
            <div className="acoes mt-9">
              <Botao href="/contato/">Encomendar uma ilustração</Botao>
              <Botao href="/portfolio/" variante="texto">Ver o portfólio</Botao>
            </div>
          </div>
          <Galeria
            imagens={pagina.imagens("ilustracaoImagens").map(paraGaleria)}
            grade="grid-cols-2 gap-4 md:gap-5 [&>li:nth-child(even)]:mt-10 md:[&>li:nth-child(even)]:mt-16"
            recorte="aspect-[4/5]"
            sizes="(min-width: 1264px) 290px, (min-width: 1024px) 24vw, 45vw"
          />
        </div>
      </Faixa>

      {/* Publicações e clientes (nomes do currículo) */}
      <section className="faixa border-t border-linha bg-surface" aria-labelledby="titulo-clientes">
        <div className="conteudo">
          <div className="revelar text-center">
            <p className="sobretitulo justify-center">{c("clientesTitulo")}</p>
            <h2 id="titulo-clientes" className="titulo-3 mx-auto mt-4 max-w-[34rem] font-medium">{c("clientesTexto")}</h2>
          </div>
          <ul className="revelar mx-auto mt-12 flex max-w-[64rem] flex-wrap items-baseline justify-center gap-x-10 gap-y-4 font-display text-[clamp(1.25rem,1.1rem+0.6vw,1.6rem)] leading-snug text-ink">
            {clientes.map((nome) => (
              <li key={nome} className="whitespace-nowrap">
                {nome}
              </li>
            ))}
          </ul>
          <div className="mt-6 text-center">
            <Pendente valor={c("clientesLogos")}>{null}</Pendente>
          </div>
        </div>
      </section>

      {/* Depoimentos: só aparecem os que já têm texto */}
      {depoimentos.length > 0 && (
        <Faixa rotulo="titulo-depoimentos">
          <h2 id="titulo-depoimentos" className="titulo-2 revelar">{c("depoimentosTitulo")}</h2>
          <ul className="mt-[var(--espaco-bloco)] grid gap-10 md:grid-cols-3 md:gap-12">
            {depoimentos.map((d, i) => (
              <li key={i} className="revelar border-t border-ocre pt-6" style={atraso(i)}>
                <figure>
                  <blockquote className="font-display text-[22px] leading-snug">
                    <Pendente valor={d.texto}>
                      <p>“{d.texto}”</p>
                    </Pendente>
                  </blockquote>
                  <figcaption className="mt-5 text-[15px]">
                    <Pendente valor={d.nome}>
                      <span className="font-bold">{d.nome}</span>
                    </Pendente>
                    <br />
                    <Pendente valor={d.papel}>
                      <span className="text-ink-muted">{d.papel}</span>
                    </Pendente>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </Faixa>
      )}

      {/* Contato */}
      <section className="faixa bg-areia" aria-labelledby="titulo-contato">
        <div className="conteudo revelar flex flex-wrap items-center justify-between gap-8">
          <div>
            <h2 id="titulo-contato" className="titulo-2">{c("contatoTitulo")}</h2>
            <p className="mt-4">{c("contatoTexto")}</p>
            <p className="mt-2">
              <a href={`mailto:${site.contato.email}`}>{site.contato.email}</a>
            </p>
          </div>
          <Botao href="/contato/" variante="vereda" seta>
            Escrever uma mensagem
          </Botao>
        </div>
      </section>
    </>
  );
}
