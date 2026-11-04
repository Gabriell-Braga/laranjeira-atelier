import type { Metadata } from "next";
import { Cormorant, Karla } from "next/font/google";
import type { ReactNode } from "react";
import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";
import { lerSite } from "@/lib/conteudo";
import "./globals.css";

const cormorant = Cormorant({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--fonte-cormorant",
  display: "swap",
});
const karla = Karla({ subsets: ["latin"], weight: ["400", "700"], variable: "--fonte-karla", display: "swap" });

const site = lerSite();

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.nome, template: `%s | ${site.nome}` },
  description: site.descricao,
  // Enquanto SITE_PUBLICO não for "sim" (variável no Cloudflare), nenhuma página é indexada.
  robots: process.env.SITE_PUBLICO === "sim" ? undefined : { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${karla.variable}`}>
      <body>
        <a
          href="#conteudo"
          className="sr-only z-50 rounded-full bg-laranja px-5 py-3 font-bold text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Pular para o conteúdo
        </a>
        <Cabecalho />
        <main id="conteudo" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <Rodape />
        {/* Cloudflare Web Analytics: sem cookies; só no site público e com token em content/site.json */}
        {site.analyticsToken && process.env.SITE_PUBLICO === "sim" && (
          <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon={JSON.stringify({ token: site.analyticsToken })} />
        )}
      </body>
    </html>
  );
}
