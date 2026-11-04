import type { Metadata } from "next";
import { pessoa } from "@/lib/dados-estruturados";
import { JsonLd, metadados } from "@/lib/meta";
import { Texto } from "@/components/Blocos";
import { Botao } from "@/components/Botao";
import { Imagem } from "@/components/Imagem";
import { Pendente } from "@/components/Pendente";
import { lerPagina, lerSite, paraGaleria } from "@/lib/conteudo";

const pagina = lerPagina("sobre");

export const metadata: Metadata = metadados({ titulo: pagina.campo("titulo"), descricao: pagina.campo("descricao"), caminho: "/sobre/", tipo: "profile" });

export default function Sobre() {
  const c = pagina.campo;
  const imagem = paraGaleria(pagina.imagens("imagem")[0]);
  return (
    <div className="conteudo pb-[56px] pt-10 md:pb-[88px] md:pt-16">
      <JsonLd dados={{ "@context": "https://schema.org", ...pessoa(lerSite()) }} />
      <div className="grid gap-12 md:grid-cols-[3fr_2fr] md:gap-16">
        <div>
          <p className="sobretitulo">{c("sobretitulo")}</p>
          <h1 className="titulo-display mt-3">{c("titulo")}</h1>
          <Texto html={pagina.html} className="leitura mt-8" />
          <div className="mt-10 flex flex-wrap gap-3">
            <Pendente valor={c("curriculo")}>
              <Botao href={c("curriculo")} variante="contorno">Currículo em PDF</Botao>
            </Pendente>
            <Botao href="/contato/">Fale comigo</Botao>
            <Botao href="/portfolio/" variante="contorno">Ver o portfólio</Botao>
          </div>
        </div>
        <div className="md:pt-24">
          <Pendente valor={c("retrato")}>{null}</Pendente>
          <Imagem img={imagem} sizes="(min-width: 768px) 40vw, 100vw" prioridade className="w-full" />
          {imagem.titulo && <p className="legenda mt-3">{imagem.titulo} · {imagem.origem} · © Dilce Laranjeira</p>}
        </div>
      </div>
    </div>
  );
}
