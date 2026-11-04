import Link from "next/link";
import { info, lerSite } from "@/lib/conteudo";
import { Botao } from "./Botao";
import { Imagem } from "./Imagem";
import { Menu, type ItemMenu } from "./Menu";

export function Cabecalho() {
  const site = lerSite();
  const itens: ItemMenu[] = [
    { href: "/livros/", rotulo: "Livros" },
    { href: "/projeto/", rotulo: "Projeto" },
    { href: "/portfolio/", rotulo: "Portfólio" },
    { href: "/sobre/", rotulo: "Sobre" },
    ...(site.mostrarAgenda ? [{ href: "/agenda/", rotulo: "Agenda" }] : []),
    { href: "/contato/", rotulo: "Contato" },
  ];
  const logo = info("wix/marca/logo-laranjeira-atelier.png", "Laranjeira Atelier");

  return (
    <header className="sticky top-0 z-40 bg-areia">
      <div className="conteudo relative flex h-[76px] items-center justify-between gap-6">
        <Link href="/" className="shrink-0" aria-label="Laranjeira Atelier: página inicial">
          <Imagem img={{ ...logo, alt: "" }} sizes="150px" prioridade className="h-[46px] w-auto" />
        </Link>
        <Menu
          itens={itens}
          compra={
            <Botao href={site.amazon["colecao-sertao-vivo"]} variante="vereda" className="px-5 py-2.5 text-[16px]">
              Comprar na Amazon
            </Botao>
          }
        />
      </div>
    </header>
  );
}
