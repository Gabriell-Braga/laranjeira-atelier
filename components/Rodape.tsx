import Link from "next/link";
import { lerSite } from "@/lib/conteudo";
import { Pendente } from "./Pendente";

export function Rodape() {
  const { contato } = lerSite();
  const whatsapp = `https://wa.me/${contato.whatsapp}?text=${encodeURIComponent(contato.whatsappMensagem)}`;

  return (
    <footer className="border-t border-linha bg-paper">
      <div className="conteudo grid gap-10 py-14 md:grid-cols-3">
        <div>
          <p className="font-display text-[26px] font-semibold leading-tight">Laranjeira Atelier</p>
          <p className="legenda mt-2">Ilustração, design gráfico e a coleção Sertão Vivo.</p>
        </div>

        <nav aria-label="Rodapé">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-[16px]">
            <li><Link href="/livros/">Livros</Link></li>
            <li><Link href="/projeto/">Projeto</Link></li>
            <li><Link href="/portfolio/">Portfólio</Link></li>
            <li><Link href="/sobre/">Sobre</Link></li>
            <li><Link href="/escolas-e-livrarias/">Escolas e livrarias</Link></li>
            <li><Link href="/contato/">Contato</Link></li>
            <li><Link href="/privacidade/">Privacidade</Link></li>
          </ul>
        </nav>

        <ul className="space-y-2 text-[16px]">
          <li><a href={`mailto:${contato.email}`}>{contato.email}</a></li>
          <Pendente valor={contato.whatsapp}>
            <li><a href={whatsapp} target="_blank" rel="noopener">WhatsApp</a></li>
          </Pendente>
          <Pendente valor={contato.instagram}>
            <li><a href={contato.instagram} target="_blank" rel="noopener">Instagram</a></li>
          </Pendente>
        </ul>
      </div>
      <div className="border-t border-linha">
        <p className="conteudo legenda py-5">© {new Date().getFullYear()} Dilce Laranjeira. Todas as ilustrações são de autoria de Dilce Laranjeira.</p>
      </div>
    </footer>
  );
}
