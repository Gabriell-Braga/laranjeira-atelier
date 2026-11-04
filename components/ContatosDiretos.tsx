import { lerSite } from "@/lib/conteudo";
import { Pendente } from "./Pendente";

// E-mail, WhatsApp (com mensagem pronta) e Instagram, vindos de content/site.json.
export function ContatosDiretos({ titulo }: { titulo: string }) {
  const { contato } = lerSite();
  const whatsapp = `https://wa.me/${contato.whatsapp}?text=${encodeURIComponent(contato.whatsappMensagem)}`;
  return (
    <div>
      <h2 className="titulo-3">{titulo}</h2>
      <ul className="mt-5 space-y-4">
        <li>
          <span className="block text-[15px] font-bold text-ink-muted">E-mail</span>
          <a href={`mailto:${contato.email}`} className="text-[18px]">{contato.email}</a>
        </li>
        <Pendente valor={contato.whatsapp}>
          <li>
            <span className="block text-[15px] font-bold text-ink-muted">WhatsApp</span>
            <a href={whatsapp} target="_blank" rel="noopener" className="text-[18px]">Conversar pelo WhatsApp</a>
          </li>
        </Pendente>
        <Pendente valor={contato.instagram}>
          <li>
            <span className="block text-[15px] font-bold text-ink-muted">Instagram</span>
            <a href={contato.instagram} target="_blank" rel="noopener" className="text-[18px]">Ver no Instagram</a>
          </li>
        </Pendente>
      </ul>
    </div>
  );
}
