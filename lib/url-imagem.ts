// ?imagem=slug na URL (link direto para uma ilustração). Sem dependências: fica fora do lightbox.
export function atualizarUrlImagem(slug: string | null) {
  const url = new URL(window.location.href);
  if (slug) url.searchParams.set("imagem", slug);
  else url.searchParams.delete("imagem");
  window.history.replaceState(window.history.state, "", url);
}

export const slugDaUrl = () => new URLSearchParams(window.location.search).get("imagem");
