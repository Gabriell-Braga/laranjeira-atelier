import type { Metadata } from "next";
import { websiteEPessoa } from "@/lib/dados-estruturados";
import { JsonLd, metadados } from "@/lib/meta";
import { Citacao, Faixa, Texto } from "@/components/Blocos";
import { Botao } from "@/components/Botao";
import { CartaoLivro } from "@/components/CartaoLivro";
import { Galeria } from "@/components/Galeria";
import { Imagem } from "@/components/Imagem";
import { info, lerLivros, lerPagina, lerSite, paraGaleria } from "@/lib/conteudo";

const pagina = lerPagina("inicio");

export const metadata: Metadata = metadados({ titulo: pagina.campo("titulo"), descricao: pagina.campo("descricao"), caminho: "/", absoluto: true });

export default function Inicio() {
  const site = lerSite();
  const livros = lerLivros();
  const volumes = livros.filter((l) => l.slug !== "colecao-sertao-vivo");
  const c = pagina.campo;

  return (
    <>
      <JsonLd dados={websiteEPessoa(site)} />
      {/* Destaque */}
      <section className="conteudo grid items-center gap-10 pb-14 pt-10 md:grid-cols-[5fr_6fr] md:gap-14 md:pb-[88px] md:pt-16">
        <div>
          <p className="sobretitulo">{c("destaqueSobretitulo")}</p>
          <h1 className="titulo-display mt-3">{c("destaque")}</h1>
          <div className="mt-8 flex flex-wrap gap-3">
            <Botao href="/livros/">Conhecer a coleção</Botao>
            <Botao href={site.amazon["colecao-sertao-vivo"]} variante="vereda" aria-label="Comprar na Amazon: Coleção Sertão Vivo (abre em nova aba)">
              Comprar na Amazon
            </Botao>
          </div>
        </div>
        <Imagem
          img={info(c("imagemDestaque"), c("imagemDestaqueAlt"))}
          sizes="(min-width: 1264px) 660px, (min-width: 768px) 52vw, calc(100vw - 40px)"
          prioridade
          className="w-full"
        />
      </section>

      {/* A coleção */}
      <Faixa className="border-t border-linha bg-surface" rotulo="titulo-colecao">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="titulo-colecao" className="titulo-2">{c("colecaoTitulo")}</h2>
            <p className="mt-3 text-ink-muted">{c("colecaoTexto")}</p>
          </div>
          <Botao href="/livros/" variante="contorno">Ver a coleção</Botao>
        </div>
        <ul className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {volumes.map((l) => (
            <li key={l.slug}>
              <CartaoLivro livro={l} amazon={site.amazon[l.slug]} />
            </li>
          ))}
        </ul>
      </Faixa>

      {/* Por dentro dos livros */}
      <Faixa rotulo="titulo-pranchas">
        <h2 id="titulo-pranchas" className="titulo-2">{c("pranchasTitulo")}</h2>
        <p className="leitura mt-4 text-ink-muted">{c("pranchasTexto")}</p>
        <div className="mt-10">
          <Galeria imagens={pagina.imagens("pranchas").map(paraGaleria)} grade="sm:grid-cols-2 gap-6" sizes="(min-width: 1264px) 600px, (min-width: 640px) 50vw, 100vw" />
        </div>
      </Faixa>

      <Citacao texto={c("citacao")} fonte={c("citacaoFonte")} />

      {/* Ilustração e design */}
      <Faixa rotulo="titulo-ilustracao">
        <div className="grid gap-10 md:grid-cols-[2fr_3fr] md:gap-14">
          <div>
            <h2 id="titulo-ilustracao" className="titulo-2">{c("ilustracaoTitulo")}</h2>
            <Texto html={pagina.html} className="leitura mt-5" />
            <div className="mt-8 flex flex-wrap gap-3">
              <Botao href="/contato/">Encomendar uma ilustração</Botao>
              <Botao href="/portfolio/" variante="contorno">Ver o portfólio</Botao>
            </div>
          </div>
          <Galeria imagens={pagina.imagens("ilustracaoImagens").map(paraGaleria)} grade="grid-cols-2" sizes="(min-width: 1264px) 340px, (min-width: 768px) 30vw, 50vw" />
        </div>
      </Faixa>

      {/* Contato */}
      <section className="faixa bg-areia" aria-labelledby="titulo-contato">
        <div className="conteudo flex flex-wrap items-center justify-between gap-8">
          <div>
            <h2 id="titulo-contato" className="titulo-2">{c("contatoTitulo")}</h2>
            <p className="mt-3">{c("contatoTexto")}</p>
            <p className="mt-2">
              <a href={`mailto:${site.contato.email}`}>{site.contato.email}</a>
            </p>
          </div>
          <Botao href="/contato/" variante="vereda">Escrever uma mensagem</Botao>
        </div>
      </section>
    </>
  );
}
