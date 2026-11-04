// Lê e valida o conteúdo de /content no build. Só roda no servidor.
// Se algo obrigatório faltar, o build para com a mensagem do zod e o nome do arquivo.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { z } from "zod";
import type { ImagemGaleria, ImagemInfo } from "./imagem";
import { destacarPendencias, tratarMarkdown } from "./pendencias";
import { GRUPO_DA_TECNICA, lerPortfolioCsv, TECNICAS, type ItemPortfolio, type Tecnica } from "./portfolio-dados";
import type { ItemIndice } from "./portfolio-indice";

const RAIZ = process.cwd();
const CONTENT = path.join(RAIZ, "content");

type Manifesto = Record<string, { largura: number; altura: number; larguras: number[]; cor: string; transparente: boolean; placeholder: string }>;
const manifesto: Manifesto = JSON.parse(fs.readFileSync(path.join(RAIZ, "public/img/manifest.json"), "utf8"));

// ---------- Esquemas ----------

// Técnicas e tipos ficam em lib/portfolio-dados.ts (compartilhado com os scripts).
const NOMES_TECNICAS = Object.keys(TECNICAS) as [Tecnica, ...Tecnica[]];

const arquivoImagem = z.string().refine((a) => a in manifesto, {
  error: (i) =>
    `imagem "${String(i.input)}" não existe em public/img/manifest.json. ` +
    `Coloque o original em content/originais/${String(i.input)} e rode "npm run imagens".`,
});

const imagem = z.object({
  arquivo: arquivoImagem,
  alt: z.string({ error: "falta o texto alternativo (alt) da imagem" }).trim().min(1, "o alt da imagem está vazio"),
  titulo: z.string().optional(),
  cientifico: z.string().optional(),
  tecnicas: z.array(z.enum(NOMES_TECNICAS)).default([]),
  origem: z.string().optional(),
  descricao: z.string().optional(),
  link: z.string().optional(),
});
export type Imagem = z.infer<typeof imagem>;

const site = z.object({
  nome: z.string(),
  autora: z.string(),
  descricao: z.string(),
  url: z.url(),
  contato: z.object({
    email: z.email(),
    whatsapp: z.string(),
    whatsappMensagem: z.string(),
    instagram: z.string(),
  }),
  amazon: z.record(z.string(), z.string()),
  curriculo: z.string(),
  mostrarAgenda: z.boolean(),
});

const livro = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  ordem: z.number().int(),
  volume: z.string(),
  titulo: z.string(),
  subtitulo: z.string(),
  autora: z.string(),
  paginas: z.number().int().positive(),
  formato: z.string(),
  encadernacao: z.string(),
  isbn: z.string(),
  ficha: z.array(z.object({ rotulo: z.string(), valor: z.string() })).default([]),
  descricao: z.array(z.string()).min(1),
  capa: imagem,
  imagens: z.array(imagem),
});

export type Livro = z.infer<typeof livro>;

const pagina = z.looseObject({
  titulo: z.string(),
  descricao: z.string(),
  imagemDestaque: arquivoImagem.optional(),
  imagemDestaqueAlt: z.string().optional(),
});

// ---------- Leitura ----------

function validar<T>(esquema: z.ZodType<T>, dados: unknown, arquivo: string): T {
  const r = esquema.safeParse(dados);
  if (!r.success) throw new Error(`\nConteúdo inválido em ${arquivo}:\n${z.prettifyError(r.error)}\n`);
  return r.data;
}

const lerJson = (rel: string) => JSON.parse(fs.readFileSync(path.join(CONTENT, rel), "utf8"));
const listar = (pasta: string, ext: string) =>
  fs.readdirSync(path.join(CONTENT, pasta)).filter((f) => f.endsWith(ext)).sort();

export const lerSite = () => validar(site, lerJson("site.json"), "content/site.json");

export const lerLivros = () =>
  listar("livros", ".json")
    .map((f) => validar(livro, lerJson(`livros/${f}`), `content/livros/${f}`))
    .sort((a, b) => a.ordem - b.ordem);

export const lerLivro = (slug: string) => lerLivros().find((l) => l.slug === slug);

// Campo de texto obrigatório do front matter (o build para se faltar).
export function campo(dados: Record<string, unknown>, chave: string, pagina: string): string {
  const v = dados[chave];
  if (typeof v !== "string" || !v.trim()) throw new Error(`Falta o campo "${chave}" em content/paginas/${pagina}.md`);
  return v;
}

export function lerPagina(nome: string) {
  const arquivo = `content/paginas/${nome}.md`;
  const { data, content } = matter(fs.readFileSync(path.join(RAIZ, arquivo), "utf8"));
  const dados = validar(pagina, data, arquivo);
  return {
    dados,
    campo: (chave: string) => campo(dados, chave, nome),
    // Lista de arquivos de imagem no front matter, resolvida com os dados (alt, título) de livros e portfólio.
    imagens: (chave: string) => {
      const lista = dados[chave];
      if (!Array.isArray(lista)) throw new Error(`Falta a lista "${chave}" em ${arquivo}`);
      return lista.map((a) => buscarImagem(String(a), `${arquivo} (${chave})`));
    },
    html: destacarPendencias(marked.parse(tratarMarkdown(content), { async: false })),
  };
}

// ---------- Imagens resolvidas para os componentes ----------

export function info(arquivo: string, alt: string): ImagemInfo {
  const m = manifesto[arquivo];
  if (!m) throw new Error(`imagem "${arquivo}" não existe em public/img/manifest.json`);
  return {
    base: "/img/" + arquivo.replace(/\.[^.]+$/, ""),
    larguras: m.larguras,
    largura: m.largura,
    altura: m.altura,
    cor: m.cor,
    placeholder: m.transparente ? undefined : m.placeholder,
    alt,
  };
}

// Imagens dos livros recebem a origem "Livro <título>" na legenda do lightbox.
export const imagensDoLivro = (l: Livro): Imagem[] =>
  [l.capa, ...l.imagens].map((img) => ({ ...img, origem: img.origem ?? `Livro ${l.titulo}` }));

// Procura um arquivo nos livros e no portfólio para reaproveitar alt, título e legenda.
function buscarImagem(arquivo: string, onde: string): Imagem {
  const todas = [...lerLivros().flatMap(imagensDoLivro), ...lerPortfolio().itens.map(paraImagem)];
  const achada = todas.find((i) => i.arquivo === arquivo);
  if (!achada) throw new Error(`A imagem "${arquivo}" citada em ${onde} não está em nenhum livro nem no portfólio.`);
  return achada;
}

export function paraGaleria(img: Imagem): ImagemGaleria {
  return {
    ...info(img.arquivo, img.alt),
    slug: path.basename(img.arquivo).replace(/\.[^.]+$/, ""),
    titulo: img.titulo,
    cientifico: img.cientifico,
    tecnica: img.tecnicas.map((t) => TECNICAS[t]).join(", ") || undefined,
    origem: img.origem,
    descricao: img.descricao,
  };
}

// ---------- Portfólio (content/portfolio.csv + content/portfolio/series.json) ----------

let portfolioEmCache: ReturnType<typeof lerPortfolioCsv> | undefined;

/** Itens válidos da planilha. Linhas com problema ficam fora e aparecem como aviso no build. */
export function lerPortfolio() {
  if (!portfolioEmCache) {
    portfolioEmCache = lerPortfolioCsv(RAIZ, (a) => a in manifesto);
    const graves = portfolioEmCache.problemas.filter((p) => p.grave);
    if (graves.length) {
      console.warn(`\nPortfólio: ${graves.length} linha(s) da planilha ficaram fora do site (detalhes: npm run portfolio).`);
    }
  }
  return portfolioEmCache;
}

export const paraImagem = (i: ItemPortfolio): Imagem => ({
  arquivo: i.arquivo,
  alt: i.alt,
  titulo: i.titulo || undefined,
  cientifico: i.cientifico,
  tecnicas: i.tecnicas,
  origem: i.origem,
  descricao: i.descricao,
});

const grupos = (tecnicas: Tecnica[]) => [...new Set(tecnicas.map((t) => GRUPO_DA_TECNICA[t]))];

/**
 * Índice completo do portfólio na ordem "Destaques": itens com destaque primeiro,
 * depois a ordem das séries e a ordem da planilha. Séries com página própria viram
 * um único cartão de projeto; capas dos livros autorais levam à página do livro.
 */
export function indicePortfolio(): ItemIndice[] {
  const { series, itens } = lerPortfolio();
  const livros = lerLivros();
  const ordemSerie = new Map(series.map((s, i) => [s.slug, i]));
  const ordenados = itens
    .map((it, i) => ({ it, i }))
    .sort((a, b) => Number(b.it.destaque) - Number(a.it.destaque) || ordemSerie.get(a.it.serie)! - ordemSerie.get(b.it.serie)! || a.i - b.i)
    .map(({ it }) => it);

  const saida: ItemIndice[] = [];
  const projetosVistos = new Set<string>();
  for (const it of ordenados) {
    const serie = series.find((s) => s.slug === it.serie)!;
    if (serie.pagina) {
      if (projetosVistos.has(serie.slug)) continue;
      projetosVistos.add(serie.slug);
      const doProjeto = itens.filter((x) => x.serie === serie.slug);
      const anos = doProjeto.map((x) => x.ano).filter((a): a is number => a !== undefined);
      saida.push({
        ...paraGaleria(paraImagem(it)),
        slug: `projeto-${serie.slug}`,
        titulo: serie.titulo,
        serie: serie.slug,
        tipo: serie.tipo,
        grupos: grupos(doProjeto.flatMap((x) => x.tecnicas)),
        ano: anos.length ? Math.max(...anos) : undefined,
        destaque: doProjeto.some((x) => x.destaque) || undefined,
        ordem: saida.length,
        href: `/portfolio/${serie.slug}/`,
        selo: `Projeto · ${doProjeto.length} imagens`,
      });
      continue;
    }
    const livro = it.tipo === "livros-autorais" ? livros.find((l) => l.capa.arquivo === it.arquivo) : undefined;
    saida.push({
      ...paraGaleria(paraImagem(it)),
      serie: it.serie,
      tipo: it.tipo,
      grupos: grupos(it.tecnicas),
      ano: it.ano,
      destaque: it.destaque || undefined,
      ordem: saida.length,
      ...(livro ? { href: `/livros/${livro.slug}/`, selo: "Livro" } : {}),
    });
  }
  return saida;
}
