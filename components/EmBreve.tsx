import { Botao } from "./Botao";
import { Imagem } from "./Imagem";
import { lerPagina, paraGaleria } from "@/lib/conteudo";

// Página provisória: cada rota que a usa é substituída pela página real na sua fase.
export function EmBreve({ titulo }: { titulo: string }) {
  const pagina = lerPagina("em-breve");
  const ilustracao = paraGaleria(pagina.imagens("imagem")[0]);
  return (
    <div className="conteudo grid items-center gap-10 pb-[56px] pt-10 md:grid-cols-2 md:gap-16 md:pb-[88px] md:pt-16">
      <div>
        <p className="sobretitulo">{pagina.campo("titulo")}</p>
        <h1 className="titulo-display mt-3">{titulo}</h1>
        <p className="mt-6 text-[20px]">{pagina.campo("frase")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Botao href="/">Voltar para o início</Botao>
          <Botao href="/livros/" variante="contorno">Conhecer os livros</Botao>
        </div>
      </div>
      <Imagem img={ilustracao} sizes="(min-width: 768px) 50vw, 100vw" prioridade className="w-full" />
    </div>
  );
}

export const metadataEmBreve = (titulo: string) => ({ title: titulo, description: lerPagina("em-breve").campo("descricao") });
