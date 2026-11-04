import { indicePortfolio } from "@/lib/conteudo";

// Gera public/portfolio/indice.json no build: metadados de todos os itens, sem imagens.
// O navegador só baixa este arquivo quando a pessoa rola, filtra ou abre o lightbox.
export const dynamic = "force-static";

export function GET() {
  return Response.json(indicePortfolio());
}
