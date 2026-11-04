import type { Metadata } from "next";
import { Botao } from "@/components/Botao";
import { Imagem } from "@/components/Imagem";
import { lerPagina, paraGaleria } from "@/lib/conteudo";

const pagina = lerPagina("nao-encontrada");

export const metadata: Metadata = { title: pagina.campo("titulo"), robots: { index: false } };

export default function NaoEncontrada() {
  const imagem = paraGaleria(pagina.imagens("imagem")[0]);
  return (
    <div className="conteudo grid items-center gap-10 pb-[56px] pt-10 md:grid-cols-2 md:gap-16 md:pb-[88px] md:pt-16">
      <div>
        <p className="sobretitulo">Erro 404</p>
        <h1 className="titulo-display mt-3">{pagina.campo("titulo")}</h1>
        <p className="mt-6 text-[20px]">{pagina.campo("frase")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Botao href="/">Ir para o início</Botao>
          <Botao href="/livros/" variante="contorno">Livros</Botao>
          <Botao href="/portfolio/" variante="contorno">Portfólio</Botao>
          <Botao href="/contato/" variante="contorno">Contato</Botao>
        </div>
      </div>
      <Imagem img={imagem} sizes="(min-width: 768px) 40vw, calc(100vw - 40px)" className="mx-auto w-full max-w-[420px]" />
    </div>
  );
}
