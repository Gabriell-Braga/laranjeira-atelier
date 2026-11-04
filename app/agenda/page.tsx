import type { Metadata } from "next";
import { Texto } from "@/components/Blocos";
import { lerPagina, lerSite } from "@/lib/conteudo";
import { pendente } from "@/lib/pendencias";

const pagina = lerPagina("agenda");

// Fora do menu e do sitemap enquanto "mostrarAgenda" for false em content/site.json.
export const metadata: Metadata = {
  title: pagina.campo("titulo"),
  ...(pendente(pagina.campo("descricao")) ? {} : { description: pagina.campo("descricao") }),
  ...(lerSite().mostrarAgenda ? {} : { robots: { index: false, follow: false } }),
};

export default function Agenda() {
  return (
    <div className="conteudo pb-[56px] pt-10 md:pb-[88px] md:pt-16">
      <p className="sobretitulo">{pagina.campo("sobretitulo")}</p>
      <h1 className="titulo-display mt-3">{pagina.campo("titulo")}</h1>
      <Texto html={pagina.html} className="leitura mt-8" />
    </div>
  );
}
