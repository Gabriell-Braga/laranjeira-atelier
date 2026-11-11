import type { Metadata } from "next";
import { metadados } from "@/lib/meta";
import { Texto, Marcado } from "@/components/Blocos";
import { ContatosDiretos } from "@/components/ContatosDiretos";
import { FormularioContato } from "@/components/FormularioContato";
import { lerPagina } from "@/lib/conteudo";

const pagina = lerPagina("contato");

export const metadata: Metadata = metadados({ titulo: pagina.campo("titulo"), descricao: pagina.campo("descricao"), caminho: "/contato/" });

export default function Contato() {
  const c = pagina.campo;
  return (
    <div className="entrada conteudo topo pb-[var(--espaco-secao)]">
      <p className="sobretitulo">{c("sobretitulo")}</p>
      <h1 className="titulo-display mt-4"><Marcado texto={c("titulo")} /></h1>
      <Texto html={pagina.html} className="leitura mt-6 text-[20px]" />
      <div className="mt-12 grid gap-14 md:grid-cols-[3fr_2fr]">
        <section aria-labelledby="titulo-formulario">
          <h2 id="titulo-formulario" className="titulo-3 mb-6">{c("formularioTitulo")}</h2>
          <FormularioContato />
        </section>
        <aside className="md:traco-l md:pl-10">
          <ContatosDiretos titulo={c("diretosTitulo")} />
        </aside>
      </div>
    </div>
  );
}
