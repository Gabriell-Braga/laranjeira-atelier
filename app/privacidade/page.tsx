import type { Metadata } from "next";
import { metadados } from "@/lib/meta";
import { Texto } from "@/components/Blocos";
import { Pendente } from "@/components/Pendente";
import { lerPagina } from "@/lib/conteudo";

const pagina = lerPagina("privacidade");

export const metadata: Metadata = metadados({ titulo: pagina.campo("titulo"), descricao: pagina.campo("descricao"), caminho: "/privacidade/" });

export default function Privacidade() {
  return (
    <div className="entrada conteudo topo pb-[var(--espaco-secao)]">
      <h1 className="titulo-display">{pagina.campo("titulo")}</h1>
      <p className="legenda mt-3">
        <Pendente valor={pagina.campo("atualizacao")}>Atualizada em {pagina.campo("atualizacao")}</Pendente>
      </p>
      <Texto html={pagina.html} className="leitura mt-8" />
    </div>
  );
}
