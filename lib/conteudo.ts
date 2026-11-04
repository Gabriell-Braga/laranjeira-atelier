// Lê e valida o conteúdo de /content no build. Só roda no servidor.
// Se algo obrigatório faltar, o build para com a mensagem do zod e o nome do arquivo.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { z } from "zod";
import type { ImagemGaleria, ImagemInfo } from "./imagem";
import { destacarPendencias, tratarMarkdown } from "./pendencias";

const RAIZ = process.cwd();
const CONTENT = path.join(RAIZ, "content");

type Manifesto = Record<string, { largura: number; altura: number; larguras: number[]; cor: string; transparente: boolean; placeholder: string }>;
const manifesto: Manifesto = JSON.parse(fs.readFileSync(path.join(RAIZ, "public/img/manifest.json"), "utf8"));

// ---------- Esquemas ----------

export const TECNICAS = ["aquarela", "grafite", "pastel", "digital", "gravura"] as const;
export type Tecnica = (typeof TECNICAS)[number];
export const ROTULO_TECNICA: Record<Tecnica, string> = {
  aquarela: "Aquarela",
  grafite: "Grafite",
  pastel: "Pastel",
  digital: "Pintura digital",
  gravura: "Gravura",
};
// Filtro do portfólio: grafite e pastel entram juntos em "Desenho".
export const FILTRO_TECNICA = { aquarela: "Aquarela", desenho: "Desenho", digital: "Digital", gravura: "Gravura" } as const;
export const GRUPO_TECNICA: Record<Tecnica, keyof typeof FILTRO_TECNICA> = {
  aquarela: "aquarela",
  grafite: "desenho",
  pastel: "desenho",
  digital: "digital",
  gravura: "gravura",
};

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
  tecnicas: z.array(z.enum(TECNICAS)).default([]),
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
  descricao: z.array(z.string()).min(1),
  capa: imagem,
  imagens: z.array(imagem),
});

const serie = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  titulo: z.string(),
  tipo: z.enum(["ilustracao", "design-grafico", "livros-autorais"]),
  ordem: z.number().int(),
  pagina: z.boolean(),
  texto: z.string().optional(),
  itens: z.array(imagem).min(1),
});

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

export const lerPortfolio = () =>
  listar("portfolio", ".json")
    .map((f) => validar(serie, lerJson(`portfolio/${f}`), `content/portfolio/${f}`))
    .sort((a, b) => a.ordem - b.ordem);

export function lerPagina(nome: string) {
  const arquivo = `content/paginas/${nome}.md`;
  const { data, content } = matter(fs.readFileSync(path.join(RAIZ, arquivo), "utf8"));
  return {
    dados: validar(pagina, data, arquivo),
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

export function paraGaleria(img: Imagem): ImagemGaleria {
  return {
    ...info(img.arquivo, img.alt),
    slug: path.basename(img.arquivo).replace(/\.[^.]+$/, ""),
    titulo: img.titulo,
    cientifico: img.cientifico,
    tecnica: img.tecnicas.map((t) => ROTULO_TECNICA[t]).join(", ") || undefined,
    origem: img.origem,
    descricao: img.descricao,
  };
}
