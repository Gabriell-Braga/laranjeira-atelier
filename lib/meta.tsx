// Metadados de cada página: título, descrição, endereço canônico e imagem de compartilhamento.
import type { Metadata } from "next";
import { pendente } from "./pendencias";

type Opcoes = {
  titulo: string;
  /** true: usa o título sem o sufixo " | Laranjeira Atelier" */
  absoluto?: boolean;
  descricao?: string;
  /** caminho da página, com barra no fim (ex.: "/livros/") */
  caminho: string;
  /** imagem 1200×630 em /og/ */
  imagem?: string;
  tipo?: "website" | "book" | "article" | "profile";
  semIndice?: boolean;
};

export function metadados({ titulo, absoluto, descricao, caminho, imagem = "/og/inicio.jpg", tipo = "website", semIndice }: Opcoes): Metadata {
  const desc = pendente(descricao) ? undefined : descricao;
  return {
    title: absoluto ? { absolute: titulo } : titulo,
    description: desc,
    alternates: { canonical: caminho },
    openGraph: {
      title: titulo,
      description: desc,
      url: caminho,
      siteName: "Laranjeira Atelier",
      locale: "pt_BR",
      type: tipo === "book" ? "book" : tipo === "profile" ? "profile" : "website",
      images: [{ url: imagem, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title: titulo, description: desc, images: [imagem] },
    ...(semIndice ? { robots: { index: false, follow: false } } : {}),
  };
}

export function JsonLd({ dados }: { dados: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dados).replace(/</g, "\\u003c") }} />;
}
