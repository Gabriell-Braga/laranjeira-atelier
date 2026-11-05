import Link from "next/link";
import { lerLivros, lerSite } from "@/lib/conteudo";
import { Pendente } from "./Pendente";

const link = "sublinhado text-ink hover:text-vereda";

export function Rodape() {
  const { contato, redes } = lerSite();
  const livros = lerLivros().filter((l) => l.slug !== "colecao-sertao-vivo");
  const whatsapp = `https://wa.me/${contato.whatsapp}?text=${encodeURIComponent(contato.whatsappMensagem)}`;

  return (
    <footer className="border-t border-linha bg-areia-clara">
      <div className="conteudo grid gap-x-10 gap-y-12 py-[var(--espaco-bloco)] sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:py-20">
        <div>
          <p className="font-display text-[30px] font-medium leading-none">Laranjeira Atelier</p>
          <p className="legenda mt-4 max-w-[22rem]">
            Ilustração, design gráfico e a Coleção Sertão Vivo, de Dilce Laranjeira.
          </p>
        </div>

        <nav aria-labelledby="rodape-site">
          <h2 id="rodape-site" className="sobretitulo mb-5 before:hidden">O atelier</h2>
          <ul className="space-y-2.5 text-[16px]">
            <li><Link className={link} href="/portfolio/">Portfólio</Link></li>
            <li><Link className={link} href="/sobre/">Sobre a Dilce</Link></li>
            <li><Link className={link} href="/escolas-e-livrarias/">Escolas e livrarias</Link></li>
            <li><Link className={link} href="/contato/">Contato</Link></li>
          </ul>
        </nav>

        <nav aria-labelledby="rodape-colecao">
          <h2 id="rodape-colecao" className="sobretitulo mb-5 before:hidden">Coleção Sertão Vivo</h2>
          <ul className="space-y-2.5 text-[16px]">
            {livros.map((l) => (
              <li key={l.slug}>
                <Link className={link} href={`/livros/${l.slug}/`}>{l.titulo}</Link>
              </li>
            ))}
            <li><Link className={link} href="/projeto/">Sobre a coleção</Link></li>
          </ul>
        </nav>

        <div>
          <h2 className="sobretitulo mb-5 before:hidden">Contato</h2>
          <ul className="space-y-2.5 text-[16px]">
            <li><a className={link} href={`mailto:${contato.email}`}>{contato.email}</a></li>
            <Pendente valor={contato.whatsapp}>
              <li><a className={link} href={whatsapp} target="_blank" rel="noopener">WhatsApp</a></li>
            </Pendente>
            <Pendente valor={contato.instagram}>
              <li><a className={link} href={contato.instagram} target="_blank" rel="noopener">Instagram</a></li>
            </Pendente>
            {redes.map((r) => (
              <Pendente key={r.nome} valor={r.url}>
                <li><a className={link} href={r.url} target="_blank" rel="noopener">{r.nome}</a></li>
              </Pendente>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-linha/80">
        <div className="conteudo flex flex-col gap-2 py-6 text-[14px] text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Dilce Laranjeira. Todas as ilustrações são de autoria de Dilce Laranjeira.</p>
          <Link className="text-ink-muted no-underline hover:underline" href="/privacidade/">Privacidade</Link>
        </div>
      </div>
    </footer>
  );
}
