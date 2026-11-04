// Importa textos e imagens do site antigo (Wix).
// Uso: node scripts/importar-wix.mjs
// - Lê a lista de páginas no HTML da home e baixa o JSON de cada página.
// - Salva o extrato em content/importacao/wix.json.
// - Baixa os originais para content/originais/wix/<pagina>/.
//   Nunca sobrescreve um arquivo que já existe: se você colocou ali a sua versão
//   (exportada do Wix), ela tem prioridade.
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";

const SITE = "https://www.laranjeiraatelier.com.br";
const RAIZ = path.resolve(import.meta.dirname, "..");
const ORIGINAIS = path.join(RAIZ, "content/originais/wix");

const slug = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/\.(jpe?g|png)$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const existe = (f) => access(f).then(() => true, () => false);

const texto = (html) =>
  html.replace(/<br\s*\/?>/g, "\n").replace(/<\/(p|h\d|li)>/g, "\n").replace(/<[^>]+>/g, "")
    .replace(/&nbsp;|​/g, " ").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
    .replace(/&([a-z]+);/gi, (m, e) => ENT[e] ?? m)
    .split("\n").map((l) => l.trim()).filter(Boolean).join("\n");
const ENT = { amp: "&", quot: '"', lt: "<", gt: ">", aacute: "á", agrave: "à", acirc: "â", atilde: "ã",
  eacute: "é", ecirc: "ê", iacute: "í", oacute: "ó", ocirc: "ô", otilde: "õ", uacute: "ú", ccedil: "ç",
  Aacute: "Á", Eacute: "É", Oacute: "Ó", Ccedil: "Ç", ldquo: "“", rdquo: "”", ndash: "–", mdash: "—", hellip: "…", bull: "•", rsquo: "’", lsquo: "‘", ordf: "ª", ordm: "º" };

async function get(url, tipo = "text") {
  const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (importacao laranjeira-atelier)" } });
  if (!r.ok) throw new Error(`${r.status} em ${url}`);
  return tipo === "buffer" ? Buffer.from(await r.arrayBuffer()) : r.text();
}

// Ordem dos itens como aparecem na página (estrutura -> dataQuery -> itens de galeria)
function ordem(estrutura, dados) {
  const ids = [];
  const add = (id) => { if (dados[id] && !ids.includes(id)) ids.push(id); };
  (function walk(c) {
    if (!c || typeof c !== "object") return;
    if (c.dataQuery) {
      const id = c.dataQuery.replace(/^#/, "");
      add(id);
      for (const it of dados[id]?.items ?? []) add(it.replace(/^#/, ""));
    }
    for (const k of ["components", "children"]) (c[k] ?? []).forEach(walk);
  })(estrutura);
  Object.keys(dados).forEach(add);
  return ids;
}

const home = await get(SITE + "/");
const paginas = [...home.matchAll(/"title":"([^"]*)"[^{}]{0,400}?"pageJsonFileName":"([^"]+)"/g)]
  .map(([, titulo, arquivo]) => ({ titulo, arquivo }));
if (!paginas.length) throw new Error("Não achei a lista de páginas no HTML da home.");

const saida = [];
for (const { titulo, arquivo } of paginas) {
  const json = JSON.parse(await get(`https://static.wixstatic.com/sites/${arquivo}.json.z?v=3`));
  const dados = json.data.document_data;
  const pasta = slug(json.pageUriSEO === "home" ? "home" : json.pageUriSEO);
  const pagina = { titulo, url: `${SITE}/${json.pageUriSEO === "home" ? "" : json.pageUriSEO}`, textos: [], imagens: [], links: [] };
  const emGaleria = new Set(Object.values(dados).filter((v) => v.type === "ImageList").flatMap((v) => v.items.map((i) => i.replace(/^#/, ""))));

  for (const id of ordem(json.structure, dados)) {
    const v = dados[id];
    if (v.type === "StyledText") pagina.textos.push(texto(v.text));
    else if (v.type === "Image") {
      const ext = path.extname(v.uri);
      const nome = `${slug(v.title || v.alt || "imagem") || "imagem"}-${v.uri.slice(7, 15)}${ext}`;
      pagina.imagens.push({
        arquivo: `wix/${pasta}/${nome}`, origem: `https://static.wixstatic.com/media/${v.uri}`,
        largura: v.width, altura: v.height, titulo: v.title ?? "", alt: v.alt ?? "",
        descricao: v.description ?? "", galeria: emGaleria.has(id),
      });
    } else if (v.type === "ExternalLink") pagina.links.push(v.url);
    else if (v.type === "EmailLink") pagina.links.push(`mailto:${v.recipient}`);
    else if (v.type === "DocumentLink") {
      pagina.links.push(`${SITE}/_files/${v.docId}`);
      pagina.imagens.push({ arquivo: `wix/${pasta}/${slug(v.name)}.pdf`, origem: `${SITE}/_files/${v.docId}`, titulo: v.name, documento: true });
    }
  }
  saida.push(pagina);
}

await mkdir(path.join(RAIZ, "content/importacao"), { recursive: true });
await writeFile(path.join(RAIZ, "content/importacao/wix.json"), JSON.stringify(saida, null, 2) + "\n");

let baixados = 0, mantidos = 0;
const falhas = [];
for (const p of saida) for (const img of p.imagens) {
  const destino = path.join(RAIZ, "content/originais", img.arquivo);
  if (await existe(destino)) { mantidos++; continue; }
  try {
    await mkdir(path.dirname(destino), { recursive: true });
    await writeFile(destino, await get(img.origem, "buffer"));
    baixados++;
  } catch (e) { falhas.push(`${img.arquivo}: ${e.message}`); }
}
console.log(`${saida.length} páginas, ${baixados} arquivos baixados, ${mantidos} já existiam.`);
if (falhas.length) { console.log("Falhas:\n" + falhas.join("\n")); process.exitCode = 1; }
