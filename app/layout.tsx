import type { Metadata } from "next";
import { Cormorant, Karla } from "next/font/google";
import type { ReactNode } from "react";
import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";
import { lerSite } from "@/lib/conteudo";
import { movimento } from "@/lib/movimento";
import { SITE_PUBLICO } from "@/lib/publico";
import "./globals.css";

const cormorant = Cormorant({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--fonte-cormorant",
  display: "swap",
});
// Itálico só aparece abaixo da primeira tela (citações, subtítulo do livro): sem preload,
// para não disputar banda com a ilustração do destaque no celular.
const cormorantItalico = Cormorant({
  subsets: ["latin"],
  weight: ["500"],
  style: ["italic"],
  variable: "--fonte-cormorant-italico",
  display: "swap",
  preload: false,
});
const karla = Karla({ subsets: ["latin"], weight: ["400", "700"], variable: "--fonte-karla", display: "swap" });

const site = lerSite();


export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.nome, template: `%s | ${site.nome}` },
  description: site.descricao,
  // Enquanto SITE_PUBLICO não for "sim" (variável de build no Cloudflare, lib/publico.ts), nenhuma página é indexada.
  robots: SITE_PUBLICO ? undefined : { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: o script de movimento põe a classe "anim" antes do React.
    <html lang="pt-BR" className={`${cormorant.variable} ${cormorantItalico.variable} ${karla.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(${movimento.toString()})()` }} />
      </head>
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
        {site.analyticsToken && SITE_PUBLICO && (
          <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon={JSON.stringify({ token: site.analyticsToken })} />
        )}
      </body>
    </html>
  );
}
