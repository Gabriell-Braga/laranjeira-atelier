import type { MetadataRoute } from "next";
import { lerSite } from "@/lib/conteudo";

// /robots.txt. Não bloqueia o site inteiro na prévia: o Google precisa ler a página
// para ver o "noindex". Só tira de circulação o que nunca deve ser rastreado.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/componentes/"] },
    sitemap: new URL("/sitemap.xml", lerSite().url).toString(),
  };
}
