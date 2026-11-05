// Animações do site, sem biblioteca. Roda como script inline no <head> (app/layout.tsx),
// antes da primeira pintura e sem esperar o React:
// - põe a classe "anim" no <html>: só então os .revelar começam escondidos (sem JS, tudo aparece);
// - .revelar ganha .visivel uma vez, ao entrar na tela (também nos que surgem depois, via MutationObserver);
// - o cabeçalho ganha data-rolado ao rolar (encolhe e fica translúcido, ver globals.css);
// - [data-parallax="0.06"] desloca o elemento uma fração da rolagem (desligado com movimento reduzido).
export function movimento() {
  const html = document.documentElement;
  html.classList.add("anim");
  const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)");

  const io =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entradas) => {
            for (const e of entradas) {
              if (!e.isIntersecting) continue;
              e.target.classList.add("visivel");
              io!.unobserve(e.target);
            }
          },
          { rootMargin: "0px 0px -6% 0px" },
        )
      : null;

  const observar = (raiz: Element) => {
    const lista = raiz.matches(".revelar") ? [raiz] : [];
    lista.push(...raiz.querySelectorAll(".revelar:not(.visivel)"));
    for (const el of lista) (io ? io.observe(el) : el.classList.add("visivel"));
  };
  new MutationObserver((mudancas) => {
    for (const m of mudancas) for (const n of m.addedNodes) if (n.nodeType === 1) observar(n as Element);
  }).observe(html, { childList: true, subtree: true });

  let agendado = false;
  const rolar = () => {
    agendado = false;
    const y = window.scrollY;
    document.querySelector(".cabecalho")?.toggleAttribute("data-rolado", y > 8);
    if (reduzir.matches || y > window.innerHeight * 1.5) return;
    for (const el of document.querySelectorAll<HTMLElement>("[data-parallax]")) {
      el.style.transform = `translate3d(0, ${(y * Number(el.dataset.parallax)).toFixed(1)}px, 0)`;
    }
  };
  window.addEventListener(
    "scroll",
    () => {
      if (agendado) return;
      agendado = true;
      requestAnimationFrame(rolar);
    },
    { passive: true },
  );
  document.addEventListener("DOMContentLoaded", rolar);
}
