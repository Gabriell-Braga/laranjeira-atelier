import type { ReactNode } from "react";
import { MOSTRAR_PENDENCIAS, pendente } from "@/lib/pendencias";

// Mostra children se o valor estiver preenchido. Se for [PREENCHER: ...],
// mostra o marcador em desenvolvimento e nada em produção.
export function Pendente({ valor, children }: { valor: string | undefined; children: ReactNode }) {
  if (!pendente(valor)) return <>{children}</>;
  return MOSTRAR_PENDENCIAS ? <mark className="preencher">{valor || "[PREENCHER]"}</mark> : null;
}
