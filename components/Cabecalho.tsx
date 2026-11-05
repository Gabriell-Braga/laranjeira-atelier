import Link from "next/link";
import { info, lerSite } from "@/lib/conteudo";
import { Botao } from "./Botao";
import { Imagem } from "./Imagem";
import { Menu, type ItemMenu } from "./Menu";

export function Cabecalho() {
  const site = lerSite();
  const itens: ItemMenu[] = [
    { href: "/livros/", rotulo: "Livros" },
    { href: "/projeto/", rotulo: "Sobre a coleção" },
    { href: "/portfolio/", rotulo: "Portfólio" },
    { href: "/sobre/", rotulo: "Sobre" },
    ...(site.mostrarAgenda ? [{ href: "/agenda/", rotulo: "Agenda" }] : []),
    { href: "/contato/", rotulo: "Contato" },
  ];
  const logo = info("wix/marca/logo-laranjeira-atelier.png", "Laranjeira Atelier");

  return (
    <header className="cabecalho sticky top-0 z-40 h-[var(--cabecalho)]">
      <div className="cabecalho-linha conteudo relative flex h-full items-center justify-between gap-6">
        <Link href="/" className="cabecalho-logo shrink-0" aria-label="Laranjeira Atelier: página inicial">
          <Imagem img={{ ...logo, alt: "" }} sizes="150px" prioridade className="h-[46px] w-auto" />
        </Link>
        <Menu
          itens={itens}
          compra={
            <Botao href={site.amazon["colecao-sertao-vivo"]} variante="vereda"
              className="px-5 py-2.5 text-[15px]"
              aria-label="Comprar a coleção na Amazon (abre em nova aba)"
            >
              Comprar a coleção
            </Botao>
          }
        />
      </div>
    </header>
  );
}
