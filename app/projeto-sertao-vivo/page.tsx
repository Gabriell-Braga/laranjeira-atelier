import type { Metadata } from "next";
import { metadados } from "@/lib/meta";
import { Texto, Marcado } from "@/components/Blocos";
import { Botao } from "@/components/Botao";
import { lerPagina } from "@/lib/conteudo";

// Texto do projeto que deu origem à coleção (o mesmo da página antiga do site Wix).
const pagina = lerPagina("projeto");

export const metadata: Metadata = metadados({ titulo: pagina.campo("titulo"), descricao: pagina.campo("descricao"), caminho: "/projeto-sertao-vivo/" });

export default function Projeto() {
  const c = pagina.campo;
  return (
    <div className="entrada conteudo topo pb-[var(--espaco-secao)]">
      <p className="sobretitulo">{c("sobretitulo")}</p>
      <h1 className="titulo-display mt-4"><Marcado texto={c("titulo")} /></h1>
      <Texto html={pagina.html} className="leitura mt-8" />
      <div className="acoes mt-12">
        <Botao href="/livros/">Sobre a coleção</Botao>
        <Botao href="/livros/#volumes" variante="texto">Conhecer os livros</Botao>
      </div>
    </div>
  );
}
