import type { Metadata } from "next";
import { metadados } from "@/lib/meta";
import { Texto } from "@/components/Blocos";
import { lerPagina, lerSite } from "@/lib/conteudo";

const pagina = lerPagina("agenda");

// Fora do menu e do sitemap enquanto "mostrarAgenda" for false em content/site.json.
export const metadata: Metadata = metadados({ titulo: pagina.campo("titulo"), descricao: pagina.campo("descricao"), caminho: "/agenda/", semIndice: !lerSite().mostrarAgenda });

export default function Agenda() {
  return (
    <div className="conteudo pb-[56px] pt-10 md:pb-[88px] md:pt-16">
      <p className="sobretitulo">{pagina.campo("sobretitulo")}</p>
      <h1 className="titulo-display mt-3">{pagina.campo("titulo")}</h1>
      <Texto html={pagina.html} className="leitura mt-8" />
    </div>
  );
}
