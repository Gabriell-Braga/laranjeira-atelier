// JSON-LD (schema.org) para o Google: a autora, o site e cada livro.
import type { Livro } from "./conteudo";
import { pendente } from "./pendencias";

type Site = { nome: string; autora: string; url: string; contato: { email: string; instagram: string }; amazon: Record<string, string> };

const abs = (site: Site, caminho: string) => new URL(caminho, site.url).toString();

export const pessoa = (site: Site) => ({
  "@type": "Person",
  "@id": abs(site, "/sobre/#dilce"),
  name: site.autora,
  url: abs(site, "/sobre/"),
  jobTitle: "Ilustradora e designer gráfica",
  worksFor: { "@type": "Organization", name: site.nome, url: abs(site, "/") },
  ...(pendente(site.contato.instagram) ? {} : { sameAs: [site.contato.instagram] }),
});

export const websiteEPessoa = (site: Site) => ({
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": abs(site, "/#site"), name: site.nome, url: abs(site, "/"), inLanguage: "pt-BR", publisher: { "@id": abs(site, "/sobre/#dilce") } },
    pessoa(site),
  ],
});

const ISBN13 = /^97[89]\d{10}$/;

export function livroLd(livro: Livro, site: Site) {
  const url = abs(site, `/livros/${livro.slug}/`);
  const autora = { "@id": abs(site, "/sobre/#dilce"), "@type": "Person", name: livro.autora };
  const oferta = site.amazon[livro.slug];
  const comum = {
    "@context": "https://schema.org",
    name: livro.titulo,
    alternativeHeadline: livro.subtitulo,
    author: autora,
    url,
    image: abs(site, `/og/livro-${livro.slug}.jpg`),
    inLanguage: "pt-BR",
    ...(oferta ? { offers: { "@type": "Offer", url: oferta, seller: { "@type": "Organization", name: "Amazon" } } } : {}),
  };
  if (livro.slug === "colecao-sertao-vivo") return { ...comum, "@type": "BookSeries" };
  return {
    ...comum,
    "@type": "Book",
    illustrator: autora,
    numberOfPages: livro.paginas,
    ...(ISBN13.test(livro.isbn13.replace(/-/g, "")) ? { isbn: livro.isbn13.replace(/-/g, "") } : {}),
    isPartOf: { "@type": "BookSeries", name: "Coleção Sertão Vivo", url: abs(site, "/livros/colecao-sertao-vivo/") },
  };
}
