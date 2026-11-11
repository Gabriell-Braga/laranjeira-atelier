import { lerLivros, lerSite } from "@/lib/conteudo";
import { LinkRodape } from "./LinkRodape";
import { Pendente } from "./Pendente";

// Rodapé em laranja queimado (o laranja da marca mais fundo), em contraste com o papel:
// texto e logo em creme (contraste 5:1, AA). O laranja da marca puro com texto claro não passa.
const link = "sublinhado text-paper";

export function Rodape() {
  const { contato, redes } = lerSite();
  const livros = lerLivros().filter((l) => l.slug !== "colecao-sertao-vivo");
  const whatsapp = `https://wa.me/${contato.whatsapp}?text=${encodeURIComponent(contato.whatsappMensagem)}`;

  return (
    <footer className="rodape bg-laranja-fundo text-paper">
      <div className="conteudo grid gap-x-10 gap-y-12 py-[var(--espaco-bloco)] sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:py-20">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element -- logo pequeno, já no tamanho certo */}
          <img src="/img/marca/logo-claro.png" alt="Laranjeira Atelier" width={343} height={106} className="h-auto w-[170px] rounded-none" />
          <p className="mt-4 max-w-[22rem] text-[15px] leading-normal">
            Ilustração, design gráfico e a Coleção Sertão Vivo, de Dilce Laranjeira.
          </p>
        </div>

        <nav aria-labelledby="rodape-site">
          <h2 id="rodape-site" className="sobretitulo mb-5 text-paper">O atelier</h2>
          <ul className="space-y-2.5 text-[16px]">
            <li><LinkRodape className={link} href="/portfolio/">Portfólio</LinkRodape></li>
            <li><LinkRodape className={link} href="/sobre/">Sobre a Dilce</LinkRodape></li>
            <li><LinkRodape className={link} href="/escolas-e-livrarias/">Escolas e livrarias</LinkRodape></li>
            <li><LinkRodape className={link} href="/contato/">Contato</LinkRodape></li>
          </ul>
        </nav>

        <nav aria-labelledby="rodape-colecao">
          <h2 id="rodape-colecao" className="sobretitulo mb-5 text-paper">Coleção Sertão Vivo</h2>
          <ul className="space-y-2.5 text-[16px]">
            {livros.map((l) => (
              <li key={l.slug}>
                <LinkRodape className={link} href={`/livros/${l.slug}/`}>{l.titulo}</LinkRodape>
              </li>
            ))}
            <li><LinkRodape className={link} href="/livros/">Sobre a coleção</LinkRodape></li>
          </ul>
        </nav>

        <div>
          <h2 className="sobretitulo mb-5 text-paper">Contato</h2>
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
      <div className="border-t border-paper/25">
        <div className="conteudo flex flex-col gap-2 py-6 text-[14px] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Dilce Laranjeira. Todas as ilustrações são de autoria de Dilce Laranjeira.</p>
          <LinkRodape className="sublinhado self-start text-paper sm:self-auto" href="/privacidade/">Privacidade</LinkRodape>
        </div>
      </div>
    </footer>
  );
}
