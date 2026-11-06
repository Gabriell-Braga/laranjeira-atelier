import type { NextConfig } from "next";
import { SITE_PUBLICO } from "./lib/publico";

const NOINDEX = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

// Endereços do site antigo (Wix) -> site novo. Só fazem efeito quando o domínio apontar para a Vercel.
// Os com acento aparecem nas duas formas (como o navegador envia e decodificada).
const ANTIGOS: [string, string][] = [
  ["/design-grafico", "/portfolio/?tipo=design-grafico"],
  ["/ilustracao", "/portfolio/?tipo=ilustracao"],
  ["/projeto-sertao-vivo", "/livros/"],
  ["/projeto-sert%C3%A3o-vivo", "/livros/"],
  ["/projeto-sertão-vivo", "/livros/"],
  ["/projeto", "/livros/"],
  ["/colecao-sertao-vivo", "/livros/"],
  ["/cole%C3%A7%C3%A3o-sert%C3%A3o-vivo", "/livros/"],
  ["/coleção-sertão-vivo", "/livros/"],
];

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
  async redirects() {
    return ANTIGOS.map(([source, destination]) => ({ source, destination, permanent: true }));
  },
  async headers() {
    return [
      // Prévia (SITE_PUBLICO diferente de "sim"): nenhum endereço é indexado.
      ...(SITE_PUBLICO ? [] : [{ source: "/:path*", headers: NOINDEX }]),
      // Os endereços técnicos da Vercel nunca devem aparecer no Google, nem depois do lançamento.
      { source: "/:path*", has: [{ type: "host" as const, value: "(?<host>.*)\\.vercel\\.app" }], headers: NOINDEX },
    ];
  },
};

export default nextConfig;
