// Índice do portfólio (public/portfolio/indice.json): metadados de todos os itens, sem imagens.
// Funções puras de filtro, usadas no build e no navegador.
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

export type Filtros = { tipo?: string; tecnica?: string; serie?: string };

export const POR_LEVA = 24;

export function filtrar(itens: ItemIndice[], f: Filtros) {
  const lista = itens.filter(
    (i) => (!f.tipo || i.tipo === f.tipo) && (!f.tecnica || i.grupos.includes(f.tecnica)) && (!f.serie || i.serie === f.serie),
  );
  return lista.sort((a, b) => a.ordem - b.ordem);
}

export function filtrosDaUrl(busca: string): Filtros {
  const p = new URLSearchParams(busca);
  return {
    tipo: p.get("tipo") || undefined,
    tecnica: p.get("tecnica") || undefined,
    serie: p.get("serie") || undefined,
  };
}

export function buscaDosFiltros(f: Filtros) {
  const p = new URLSearchParams();
  if (f.tipo) p.set("tipo", f.tipo);
  if (f.tecnica) p.set("tecnica", f.tecnica);
  if (f.serie) p.set("serie", f.serie);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const temFiltro = (f: Filtros) => Boolean(f.tipo || f.tecnica || f.serie);
