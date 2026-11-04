import type { Metadata } from "next";
import { Texto } from "@/components/Blocos";
import { Pendente } from "@/components/Pendente";
import { lerPagina } from "@/lib/conteudo";

const pagina = lerPagina("privacidade");

export const metadata: Metadata = { title: pagina.campo("titulo"), description: pagina.campo("descricao") };

export default function Privacidade() {
  return (
    <div className="conteudo pb-[56px] pt-10 md:pb-[88px] md:pt-16">
      <h1 className="titulo-display">{pagina.campo("titulo")}</h1>
      <p className="legenda mt-3">
        <Pendente valor={pagina.campo("atualizacao")}>Atualizada em {pagina.campo("atualizacao")}</Pendente>
      </p>
      <Texto html={pagina.html} className="leitura mt-8" />
    </div>
  );
}
