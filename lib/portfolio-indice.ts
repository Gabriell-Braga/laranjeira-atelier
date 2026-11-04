// Índice do portfólio (public/portfolio/indice.json): metadados de todos os itens, sem imagens.
// Funções puras de filtro e ordem, usadas no build e no navegador.
import type { ImagemGaleria } from "./imagem";

export type ItemIndice = ImagemGaleria & {
  serie: string;
  tipo: string;
  grupos: string[]; // grupos de técnica: aquarela, desenho, digital, gravura
  ano?: number;
  destaque?: boolean;
  ordem: number; // posição na ordem "Destaques"
  /** se existir, o item é um link (projeto ou livro) e não abre no lightbox */
  href?: string;
  /** rótulo sobre a miniatura, ex.: "Projeto" */
  selo?: string;
};

export type Ordem = "destaques" | "recentes" | "antigos";
export const ORDENS: Record<Ordem, string> = { destaques: "Destaques", recentes: "Mais recentes", antigos: "Mais antigos" };

export type Filtros = { tipo?: string; tecnica?: string; serie?: string; ordem: Ordem };

export const POR_LEVA = 24;

export function filtrar(itens: ItemIndice[], f: Filtros) {
  const lista = itens.filter(
    (i) => (!f.tipo || i.tipo === f.tipo) && (!f.tecnica || i.grupos.includes(f.tecnica)) && (!f.serie || i.serie === f.serie),
  );
  if (f.ordem === "destaques") return lista.sort((a, b) => a.ordem - b.ordem);
  // Sem ano vai para o fim; empates seguem a ordem "Destaques".
  const sinal = f.ordem === "recentes" ? -1 : 1;
  return lista.sort((a, b) => {
    if (a.ano === undefined || b.ano === undefined) return (a.ano === undefined ? 1 : 0) - (b.ano === undefined ? 1 : 0) || a.ordem - b.ordem;
    return sinal * (a.ano - b.ano) || a.ordem - b.ordem;
  });
}

export function filtrosDaUrl(busca: string): Filtros {
  const p = new URLSearchParams(busca);
  const ordem = p.get("ordem") as Ordem | null;
  return {
    tipo: p.get("tipo") || undefined,
    tecnica: p.get("tecnica") || undefined,
    serie: p.get("serie") || undefined,
    ordem: ordem && ordem in ORDENS ? ordem : "destaques",
  };
}

export function buscaDosFiltros(f: Filtros) {
  const p = new URLSearchParams();
  if (f.tipo) p.set("tipo", f.tipo);
  if (f.tecnica) p.set("tecnica", f.tecnica);
  if (f.serie) p.set("serie", f.serie);
  if (f.ordem !== "destaques") p.set("ordem", f.ordem);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const temFiltro = (f: Filtros) => Boolean(f.tipo || f.tecnica || f.serie || f.ordem !== "destaques");
