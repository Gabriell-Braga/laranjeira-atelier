import type { Metadata } from "next";
import { metadados } from "@/lib/meta";
import { Faixa, FichaTecnica, Texto } from "@/components/Blocos";
import { Botao } from "@/components/Botao";
import { CartaoLivro } from "@/components/CartaoLivro";
import { Imagem } from "@/components/Imagem";
import { info, lerLivros, lerPagina, lerSite } from "@/lib/conteudo";

const pagina = lerPagina("livros");

export const metadata: Metadata = metadados({ titulo: pagina.campo("titulo"), descricao: pagina.campo("descricao"), caminho: "/livros/", imagem: "/og/livros.jpg" });

export default function Livros() {
  const site = lerSite();
  const livros = lerLivros();
  const colecao = livros.find((l) => l.slug === "colecao-sertao-vivo")!;
  const volumes = livros.filter((l) => l !== colecao);
  const c = pagina.campo;

  return (
    <>
      <header className="conteudo topo pb-[var(--espaco-bloco)]">
        <p className="sobretitulo">{c("sobretitulo")}</p>
        <h1 className="titulo-display mt-4">{c("titulo")}</h1>
        <Texto html={pagina.html} className="leitura mt-6" />
      </header>

      <Faixa className="border-t border-linha bg-surface">
        <h2 className="sr-only">Os volumes</h2>
        <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {/* sem animação de entrada: as capas estão na primeira tela (LCP) */}
          {volumes.map((l, i) => (
            <li key={l.slug}>
              <CartaoLivro livro={l} amazon={site.amazon[l.slug]} prioridade={i === 0} />
            </li>
          ))}
        </ul>
      </Faixa>

      <Faixa rotulo="titulo-compra">
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
    </>
  );
}
