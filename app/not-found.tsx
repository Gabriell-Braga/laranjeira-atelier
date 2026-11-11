import type { Metadata } from "next";
import { Botao } from "@/components/Botao";
import { Imagem } from "@/components/Imagem";
import { lerPagina, paraGaleria } from "@/lib/conteudo";
import { Marcado } from "@/components/Blocos";

const pagina = lerPagina("nao-encontrada");

export const metadata: Metadata = { title: pagina.campo("titulo"), robots: { index: false } };

export default function NaoEncontrada() {
  const imagem = paraGaleria(pagina.imagens("imagem")[0]);
  return (
    <div className="conteudo grid items-center gap-10 topo pb-[var(--espaco-secao)] md:grid-cols-2 md:gap-16">
      <div className="entrada">
        <p className="sobretitulo">Erro 404</p>
        <h1 className="titulo-display mt-4"><Marcado texto={pagina.campo("titulo")} /></h1>
        <p className="mt-6 text-[20px]">{pagina.campo("frase")}</p>
        <div className="acoes mt-9">
          <Botao href="/">Ir para o início</Botao>
          <Botao href="/livros/" variante="texto">Sobre a coleção</Botao>
          <Botao href="/portfolio/" variante="texto">Portfólio</Botao>
          <Botao href="/contato/" variante="texto">Contato</Botao>
        </div>
      </div>
      <Imagem img={imagem} sizes="(min-width: 768px) 40vw, calc(100vw - 40px)" className="tinta mx-auto w-full max-w-[420px]" />
    </div>
  );
}
