import type { Metadata } from "next";
import { Botao } from "@/components/Botao";
import { CartaoLivro } from "@/components/CartaoLivro";
import { Galeria } from "@/components/Galeria";
import { Imagem } from "@/components/Imagem";
import { info, lerLivros, lerPagina, lerPortfolio, lerSite, paraGaleria, paraImagem } from "@/lib/conteudo";

// Página interna: vitrine dos componentes. Fora do menu e do sitemap.
export const metadata: Metadata = { title: "Componentes", robots: { index: false, follow: false } };

const CORES = [
  ["paper", "#F7F4EE", "fundo das páginas"],
  ["surface", "#FFFFFF", "faixas de destaque e pranchas"],
  ["areia", "#EEDBC5", "cabeçalho e faixa de contato"],
  ["laranja", "#ED7F29", "filetes, menu ativo, botão principal"],
  ["vereda", "#2F4A2A", "compra, links, faixa da citação"],
  ["ink", "#2A2620", "texto principal"],
  ["ink-muted", "#5E574C", "texto secundário e legendas"],
  ["terra", "#6B4A1E", "sobretítulos"],
  ["linha", "#E4DDD0", "filetes de separação"],
  ["ceu", "#A9B4D6", "só decorativo"],
];

// Contraste WCAG entre as combinações usadas no site.
const HEX: Record<string, string> = Object.fromEntries(CORES.map(([n, h]) => [n, h]));
HEX.branco = "#FFFFFF";
const luminancia = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a: string, b: string) => {
  const [l1, l2] = [luminancia(HEX[a]), luminancia(HEX[b])].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};
// [texto, fundo, onde, texto grande? (AA pede 3:1 em vez de 4.5:1)]
const PARES: [string, string, string, boolean][] = [
  ["ink", "paper", "texto principal", false],
  ["ink", "surface", "texto em faixas brancas", false],
  ["ink", "areia", "menu no cabeçalho", false],
  ["ink-muted", "paper", "legendas", false],
  ["ink-muted", "surface", "legendas em faixas brancas", false],
  ["terra", "paper", "sobretítulos", false],
  ["terra", "surface", "sobretítulos em faixas brancas", false],
  ["vereda", "paper", "links e botão de contorno", false],
  ["vereda", "surface", "links em faixas brancas", false],
  ["branco", "vereda", "botão de compra", false],
  ["paper", "vereda", "faixa da citação", false],
  ["ink", "laranja", "botão principal", false],
  ["laranja", "paper", "PROIBIDO como texto (só filetes e foco)", false],
];

function Secao({ titulo, children, fundo = "" }: { titulo: string; children: React.ReactNode; fundo?: string }) {
  return (
    <section className={`faixa border-t border-linha ${fundo}`}>
      <div className="conteudo">
        <h2 className="titulo-2 mb-8">{titulo}</h2>
        {children}
      </div>
    </section>
  );
}

export default function Componentes() {
  const site = lerSite();
  const livros = lerLivros();
  const aves = lerPortfolio().itens.filter((i) => i.serie === "aves").map(paraImagem);
  const ave = livros[0];
  const inicio = lerPagina("inicio").dados;

  return (
    <>
      <div className="conteudo faixa">
        <p className="sobretitulo">Página interna</p>
        <h1 className="titulo-display mt-2">Componentes</h1>
        <p className="mt-4 leitura text-ink-muted">Vitrine da identidade visual e dos componentes do site.</p>
      </div>

      <Secao titulo="Cores">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {CORES.map(([nome, hex, uso]) => (
            <li key={nome}>
              <div className="h-20 rounded-[4px] border border-linha" style={{ backgroundColor: hex }} />
              <p className="mt-2 font-bold">{nome}</p>
              <p className="legenda">{hex} · {uso}</p>
            </li>
          ))}
        </ul>
      </Secao>

      <Secao titulo="Contraste (WCAG AA)">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-[16px]">
            <thead>
              <tr className="border-b border-linha">
                <th className="py-2 pr-4">Exemplo</th>
                <th className="py-2 pr-4">Texto / fundo</th>
                <th className="py-2 pr-4">Uso</th>
                <th className="py-2 pr-4">Contraste</th>
                <th className="py-2">AA</th>
              </tr>
            </thead>
            <tbody>
              {PARES.map(([texto, fundo, uso, grande]) => {
                const c = contraste(texto, fundo);
                const passa = c >= (grande ? 3 : 4.5);
                return (
                  <tr key={texto + fundo} className="border-b border-linha">
                    <td className="py-2 pr-4">
                      <span className="inline-block rounded-[4px] border border-linha px-3 py-1" style={{ color: HEX[texto], backgroundColor: HEX[fundo] }}>
                        Aa Sertão
                      </span>
                    </td>
                    <td className="py-2 pr-4">{texto} / {fundo}</td>
                    <td className="py-2 pr-4">{uso}</td>
                    <td className="py-2 pr-4">{c.toFixed(2)}:1</td>
                    <td className="py-2 font-bold">{passa ? "passa" : "não passa"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Secao>

      <Secao titulo="Tipografia">
        <div className="space-y-6">
          <p className="titulo-display">Display: Cormorant 64/1.04</p>
          <p className="titulo-2">Título 2: Cormorant 48/1.1</p>
          <p className="titulo-3">Título 3: Cormorant 30</p>
          <p className="citacao">“Citação: Cormorant itálico 38”</p>
          <p className="sobretitulo">Livro I · 192 páginas</p>
          <p className="leitura">
            Corpo: Karla 18/1.6. Grande sertão: veredas é fascinante obra magna da literatura brasileira e mundial.
            Este parágrafo mostra a coluna de leitura, com no máximo setenta caracteres por linha.
          </p>
          <p className="legenda">Legenda: Karla 15, ink-muted.</p>
          <p><a href="#">Link em vereda</a></p>
        </div>
      </Secao>

      <Secao titulo="Botões">
        <div className="flex flex-wrap gap-4">
          <Botao href="/livros/">Conhecer a coleção</Botao>
          <Botao href={site.amazon["colecao-sertao-vivo"]} variante="vereda">Comprar na Amazon</Botao>
          <Botao href="/contato/" variante="contorno">Fale comigo</Botao>
          <Botao>Botão (button)</Botao>
        </div>
      </Secao>

      <Secao titulo="Faixa da citação" fundo="!border-0 bg-vereda text-paper">
        <blockquote className="citacao leitura">“{inicio.citacao as string}”</blockquote>
        <p className="mt-4">Dilce Laranjeira, introdução de Ave, Sertão!</p>
      </Secao>

      <Secao titulo="Imagem">
        <div className="grid gap-8 md:grid-cols-2">
          <Imagem img={info(inicio.imagemDestaque!, inicio.imagemDestaqueAlt as string)} sizes="(min-width: 768px) 50vw, 100vw" />
          <p className="legenda">
            Componente &lt;Imagem&gt;: srcset em WebP (480 a 2400px, sem ampliar), width e height do original,
            lazy loading e placeholder borrado de 24px. A imagem do topo da Início vem de
            content/paginas/inicio.md (campo imagemDestaque).
          </p>
        </div>
      </Secao>

      <Secao titulo="Cartão de livro" fundo="bg-surface">
        <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {livros.filter((l) => l.slug !== "colecao-sertao-vivo").map((l) => (
            <li key={l.slug}>
              <CartaoLivro livro={l} amazon={site.amazon[l.slug]} />
            </li>
          ))}
        </ul>
      </Secao>

      <Secao titulo="Galeria e lightbox">
        <p className="legenda mb-6">Clique em uma imagem. Setas, Esc, duplo clique ou roda do mouse para ampliar.</p>
        <Galeria imagens={aves.map(paraGaleria)} />
        <h3 className="titulo-3 mb-6 mt-14">Variante livro</h3>
        <div className="max-w-xl">
          <Galeria variante="livro" imagens={[ave.capa, ...ave.imagens].map(paraGaleria)} />
        </div>
      </Secao>
    </>
  );
}
