// Portfólio: lê content/portfolio.csv (a lista oficial, editada pela Dilce no Google Sheets)
// e content/portfolio/series.json. Usado pelo site (lib/conteudo.ts) e pelo script
// scripts/portfolio.mjs. Sem imports internos, para o Node rodar este arquivo direto.
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

export const COLUNAS = [
  "arquivo",
  "titulo",
  "serie",
  "tipo",
  "tecnica",
  "ano",
  "ano_fonte",
  "cliente_ou_livro",
  "nome_cientifico",
  "descricao",
  "destaque",
  "alt",
] as const;

export const TIPOS = { ilustracao: "Ilustração", "design-grafico": "Design gráfico", "livros-autorais": "Livros autorais" } as const;
export type Tipo = keyof typeof TIPOS;

export const TECNICAS = {
  aquarela: "Aquarela",
  desenho: "Desenho",
  grafite: "Grafite",
  pastel: "Pastel",
  digital: "Pintura digital",
  gravura: "Gravura",
} as const;
export type Tecnica = keyof typeof TECNICAS;

// Filtro do portfólio: grafite e pastel entram juntos em "Desenho".
export const GRUPOS_TECNICA = { aquarela: "Aquarela", desenho: "Desenho", digital: "Digital", gravura: "Gravura" } as const;
export type GrupoTecnica = keyof typeof GRUPOS_TECNICA;
export const GRUPO_DA_TECNICA: Record<Tecnica, GrupoTecnica> = {
  aquarela: "aquarela",
  desenho: "desenho",
  grafite: "desenho",
  pastel: "desenho",
  digital: "digital",
  gravura: "gravura",
};

// ---------- CSV (RFC 4180: aspas, vírgulas e quebras de linha dentro de campos) ----------

export function lerCsv(texto: string): Record<string, string>[] {
  const linhas: string[][] = [];
  let campo = "";
  let linha: string[] = [];
  let aspas = false;
  const s = texto.replace(/^﻿/, ""); // BOM do Excel/Sheets
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (aspas) {
      if (c === '"' && s[i + 1] === '"') (campo += '"'), i++;
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ",") linha.push(campo), (campo = "");
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      linha.push(campo), linhas.push(linha), (linha = []), (campo = "");
    } else campo += c;
  }
  if (campo || linha.length) linha.push(campo), linhas.push(linha);
  const [cabecalho = [], ...resto] = linhas.filter((l) => l.some((v) => v.trim()));
  const nomes = cabecalho.map((n) => n.trim().toLowerCase());
  return resto.map((l) => Object.fromEntries(nomes.map((n, i) => [n, (l[i] ?? "").trim()])));
}

// ---------- Tipos ----------

const serieSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  titulo: z.string(),
  tipo: z.enum(Object.keys(TIPOS) as [Tipo, ...Tipo[]]),
  ordem: z.number().int(),
  pagina: z.boolean(),
  texto: z.string().optional(),
});
export type Serie = z.infer<typeof serieSchema>;

export type ItemPortfolio = {
  id: string; // nome do arquivo sem extensão; usado em ?imagem=
  linha: number; // linha na planilha (para as mensagens)
  arquivo: string;
  titulo: string;
  serie: string;
  tipo: Tipo;
  tecnicas: Tecnica[];
  ano?: number;
  anoFonte?: string;
  origem?: string;
  cientifico?: string;
  descricao?: string;
  destaque: boolean;
  alt: string;
};

export type Problema = { linha?: number; arquivo?: string; mensagem: string; grave: boolean };

// Aceita "Aquarela", "pintura digital", "Grafite"... como na planilha da Dilce.
const APELIDOS: Record<string, string> = { "pintura digital": "digital" };
export const normalizarTecnica = (t: string) => {
  const s = t.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return APELIDOS[s] ?? s;
};

const SIM = new Set(["sim", "s", "x", "1", "true", "yes"]);

// ---------- Leitura ----------

export function lerSeries(raiz: string): Serie[] {
  const arquivo = path.join(raiz, "content/portfolio/series.json");
  const r = z.array(serieSchema).safeParse(JSON.parse(fs.readFileSync(arquivo, "utf8")));
  if (!r.success) throw new Error(`\nConteúdo inválido em content/portfolio/series.json:\n${z.prettifyError(r.error)}\n`);
  return r.data.sort((a, b) => a.ordem - b.ordem);
}

/**
 * Lê a planilha e devolve os itens válidos e a lista de problemas.
 * `existe(arquivo)` diz se a imagem existe (no manifest de public/img).
 * Itens sem título nem alt, sem imagem ou com série/tipo desconhecidos ficam fora do site.
 */
export function lerPortfolioCsv(raiz: string, existe: (arquivo: string) => boolean) {
  const series = lerSeries(raiz);
  const porSlug = new Map(series.map((s) => [s.slug, s]));
  const linhas = lerCsv(fs.readFileSync(path.join(raiz, "content/portfolio.csv"), "utf8"));
  const itens: ItemPortfolio[] = [];
  const problemas: Problema[] = [];
  const vistos = new Set<string>();

  linhas.forEach((l, i) => {
    const linha = i + 2; // linha 1 é o cabeçalho
    const p = (mensagem: string, grave = true) => problemas.push({ linha, arquivo: l.arquivo, mensagem, grave });
    if (!l.arquivo) return p("linha sem arquivo");
    if (vistos.has(l.arquivo)) return p("arquivo repetido na planilha (fica só a primeira linha)");
    vistos.add(l.arquivo);
    if (!existe(l.arquivo)) return p("linha sem imagem: o arquivo não existe (coloque em content/originais e rode npm run imagens)");
    if (!l.titulo && !l.alt) return p("sem título nem alt: fica fora do site até alguém preencher");
    if (!l.alt) return p("alt vazio: fica fora do site até alguém descrever a imagem");
    const serie = porSlug.get(l.serie);
    if (!serie) return p(`série "${l.serie}" não existe em content/portfolio/series.json`);
    const tipo = (l.tipo || serie.tipo) as Tipo;
    if (!(tipo in TIPOS)) return p(`tipo "${l.tipo}" desconhecido (use: ${Object.keys(TIPOS).join(", ")})`);

    const tecnicas: Tecnica[] = [];
    for (const t of l.tecnica.split(/[;,]/).map(normalizarTecnica).filter(Boolean)) {
      if (t in TECNICAS) tecnicas.push(t as Tecnica);
      else p(`técnica "${t}" desconhecida, ignorada (use: ${Object.keys(TECNICAS).join(", ")})`, false);
    }
    let ano: number | undefined;
    if (l.ano) {
      ano = Number(l.ano);
      if (!Number.isInteger(ano) || ano < 1950 || ano > 2100) (ano = undefined), p(`ano "${l.ano}" inválido, ignorado`, false);
    }

    itens.push({
      id: path.basename(l.arquivo).replace(/\.[^.]+$/, ""),
      linha,
      arquivo: l.arquivo,
      titulo: l.titulo || "",
      serie: serie.slug,
      tipo,
      tecnicas,
      ano,
      anoFonte: l.ano_fonte || undefined,
      origem: l.cliente_ou_livro || undefined,
      cientifico: l.nome_cientifico || undefined,
      descricao: l.descricao || undefined,
      destaque: SIM.has((l.destaque || "").toLowerCase()),
      alt: l.alt,
    });
  });

  const ids = new Map<string, string>();
  for (const it of itens) {
    if (ids.has(it.id)) problemas.push({ linha: it.linha, arquivo: it.arquivo, mensagem: `mesmo nome de arquivo que ${ids.get(it.id)}: o link ?imagem= fica ambíguo`, grave: false });
    ids.set(it.id, it.arquivo);
  }
  return { series, itens, problemas };
}
