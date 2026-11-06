import type { MetadataRoute } from "next";
import { lerLivros, lerPortfolio, lerSite } from "@/lib/conteudo";

// /sitemap.xml gerado no build. Agenda só entra se "mostrarAgenda" for true; /componentes/ nunca entra.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = lerSite();
  const caminhos = [
    "/",
    "/livros/",
    ...lerLivros().map((l) => `/livros/${l.slug}/`),
    "/portfolio/",
    ...lerPortfolio()
      .series.filter((s) => s.pagina)
      .map((s) => `/portfolio/${s.slug}/`),
    "/sobre/",
    "/contato/",
    "/escolas-e-livrarias/",
    ...(site.mostrarAgenda ? ["/agenda/"] : []),
    "/privacidade/",
  ];
  return caminhos.map((c) => ({ url: new URL(c, site.url).toString() }));
}
