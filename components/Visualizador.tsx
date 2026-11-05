"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { srcSet, urlImagem, type ImagemGaleria } from "@/lib/imagem";
import { atualizarUrlImagem } from "@/lib/url-imagem";

const LUPA = 220; // diâmetro da lupa, em px
const AUMENTO = 2.6; // aumento dentro da lupa, em relação à imagem na tela

function Legenda({ img }: { img: ImagemGaleria }) {
  const partes = [img.tecnica, img.origem, img.descricao].filter(Boolean);
  return (
    <>
      {img.cientifico && <i>{img.cientifico}</i>}
      {img.cientifico && " · "}
      {partes.join(" · ")}
      {partes.length > 0 && " · "}© Dilce Laranjeira
    </>
  );
}

const Seta = ({ esquerda }: { esquerda?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 16 16" aria-hidden="true" className={esquerda ? "rotate-180" : ""}>
    <path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type Props = {
  imagens: ImagemGaleria[];
  /** índice aberto; -1 = fechado */
  indice: number;
  /** chamado ao navegar dentro do visualizador */
  aoVer: (indice: number) => void;
  aoFechar: () => void;
  /** chamado depois de fechar (bom momento para devolver o foco) */
  aoSair?: () => void;
};

// Visualizador de imagens em <dialog> nativo (foco preso, Esc e aria-modal vêm do navegador).
// Nada fica por cima da obra: contador e fechar em cima, legenda e miniaturas embaixo.
// Com mouse, uma lupa redonda acompanha o cursor e mostra a imagem ampliada.
export function Visualizador({ imagens, indice, aoVer, aoFechar, aoSair }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const lupa = useRef<HTMLDivElement>(null);
  const toque = useRef<number | null>(null);
  const [lupaAtiva, setLupaAtiva] = useState(false);
  const aberto = indice >= 0 && !!imagens[indice];
  const img = aberto ? imagens[indice] : null;
  const total = imagens.length;

  const ir = useCallback(
    (passo: number) => {
      if (total < 2) return;
      const novo = (indice + passo + total) % total;
      atualizarUrlImagem(imagens[novo].slug);
      aoVer(novo);
    },
    [indice, total, imagens, aoVer],
  );

  // Abre/fecha o <dialog> conforme o índice e trava a rolagem da página por baixo.
  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (aberto && !d.open) {
      d.showModal();
      document.documentElement.style.overflow = "hidden";
    }
    if (!aberto && d.open) d.close();
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    const teclas = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") ir(1);
      if (e.key === "ArrowLeft") ir(-1);
    };
    window.addEventListener("keydown", teclas);
    return () => window.removeEventListener("keydown", teclas);
  }, [aberto, ir]);

  // A miniatura atual fica sempre visível na faixa de baixo.
  useEffect(() => {
    if (!aberto) return;
    dialogo.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [aberto, indice]);

  // Pré-carrega a vizinha seguinte para a navegação não piscar.
  useEffect(() => {
    if (!aberto || total < 2) return;
    const prox = imagens[(indice + 1) % total];
    const pre = new Image();
    pre.sizes = "100vw";
    pre.srcset = srcSet(prox);
  }, [aberto, indice, imagens, total]);

  const aoFecharDialogo = () => {
    document.documentElement.style.overflow = "";
    setLupaAtiva(false);
    atualizarUrlImagem(null);
    aoFechar();
    aoSair?.();
  };

  // ---------- Pinça no celular: amplia só a imagem (a página não dá zoom) ----------
  // Dois dedos ampliam (até 4x); com a imagem ampliada, um dedo arrasta; toque duplo alterna 1x/2,5x.
  const dedos = useRef(new Map<number, { x: number; y: number }>());
  const zoom = useRef({ escala: 1, x: 0, y: 0, inicioDist: 0, inicioEscala: 1, ultimoToque: 0 });
  const aplicarZoom = (el: HTMLElement, animar = false) => {
    const z = zoom.current;
    el.style.transition = animar ? "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)" : "none";
    el.style.transform = z.escala === 1 ? "" : `translate(${z.x}px, ${z.y}px) scale(${z.escala})`;
  };
  useEffect(() => {
    zoom.current = { escala: 1, x: 0, y: 0, inicioDist: 0, inicioEscala: 1, ultimoToque: 0 };
    dedos.current.clear();
  }, [indice]);
  const distancia = () => {
    const [a, b] = [...dedos.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  const tocar = (e: React.PointerEvent<HTMLImageElement>) => {
    if (e.pointerType === "mouse") return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    dedos.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const z = zoom.current;
    if (dedos.current.size === 2) {
      toque.current = null; // pinça não conta como arrastar para trocar de imagem
      z.inicioDist = distancia();
      z.inicioEscala = z.escala;
    } else if (dedos.current.size === 1) {
      const agora = Date.now();
      if (agora - z.ultimoToque < 300) {
        z.escala = z.escala > 1 ? 1 : 2.5;
        z.x = z.y = 0;
        aplicarZoom(e.currentTarget, true);
        z.ultimoToque = 0;
      } else z.ultimoToque = agora;
    }
  };
  const arrastarZoom = (e: React.PointerEvent<HTMLImageElement>) => {
    if (e.pointerType === "mouse") return moverLupa(e);
    const antes = dedos.current.get(e.pointerId);
    if (!antes) return;
    dedos.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const z = zoom.current;
    if (dedos.current.size === 2 && z.inicioDist > 0) {
      z.escala = Math.min(4, Math.max(1, (z.inicioEscala * distancia()) / z.inicioDist));
      if (z.escala === 1) z.x = z.y = 0;
      aplicarZoom(e.currentTarget);
    } else if (dedos.current.size === 1 && z.escala > 1) {
      const r = e.currentTarget.getBoundingClientRect();
      // limita o arraste para a imagem não sair da tela
      const maxX = (r.width - r.width / z.escala) / 2;
      const maxY = (r.height - r.height / z.escala) / 2;
      z.x = Math.min(maxX, Math.max(-maxX, z.x + e.clientX - antes.x));
      z.y = Math.min(maxY, Math.max(-maxY, z.y + e.clientY - antes.y));
      aplicarZoom(e.currentTarget);
    }
  };
  const soltar = (e: React.PointerEvent<HTMLImageElement>) => {
    dedos.current.delete(e.pointerId);
    const z = zoom.current;
    if (z.escala < 1.05 && z.escala !== 1) {
      z.escala = 1;
      z.x = z.y = 0;
      aplicarZoom(e.currentTarget, true);
    }
  };

  const moverLupa = (e: React.PointerEvent<HTMLImageElement>) => {
    if (e.pointerType !== "mouse" || !lupa.current || !img) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    // a lupa é posicionada no quadro (maior que a imagem); o fundo, pela posição na imagem
    const q = e.currentTarget.parentElement!.getBoundingClientRect();
    const l = lupa.current.style;
    l.transform = `translate(${e.clientX - q.left - LUPA / 2}px, ${e.clientY - q.top - LUPA / 2}px)`;
    l.backgroundSize = `${r.width * AUMENTO}px ${r.height * AUMENTO}px`;
    l.backgroundPosition = `${-(x * AUMENTO - LUPA / 2)}px ${-(y * AUMENTO - LUPA / 2)}px`;
    if (!lupaAtiva) setLupaAtiva(true);
  };

  return (
    <dialog
      ref={dialogo}
      className="visualizador"
      aria-label={img ? `Imagem ${indice + 1} de ${total}: ${img.titulo ?? img.alt}` : "Visualizador de imagens"}
      onClose={aoFecharDialogo}
      onClick={(e) => e.target === e.currentTarget && dialogo.current?.close()}
    >
      {img && (
        // O foco inicial vai para a própria grade (sem anel visível); Tab leva ao botão Fechar.
        <div className="vz-grade outline-none" tabIndex={-1} autoFocus>
          <div className="vz-topo">
            <p className="text-[14px] tracking-[0.12em] text-paper/70" aria-hidden="true">
              {total > 1 ? `${String(indice + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}` : ""}
            </p>
            <button type="button" onClick={() => dialogo.current?.close()} className="vz-botao" aria-label="Fechar">
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div
            className="vz-palco"
            onPointerDown={(e) => {
              // arrastar para o lado troca de imagem, mas não durante a pinça nem com a imagem ampliada
              if (e.pointerType !== "mouse" && dedos.current.size <= 1) toque.current = e.clientX;
            }}
            onPointerUp={(e) => {
              if (toque.current === null || zoom.current.escala > 1) {
                toque.current = null;
                return;
              }
              const dx = e.clientX - toque.current;
              toque.current = null;
              if (Math.abs(dx) > 50) ir(dx < 0 ? 1 : -1);
            }}
          >
            {total > 1 && (
              <button type="button" onClick={() => ir(-1)} className="vz-botao vz-seta" aria-label="Imagem anterior">
                <Seta esquerda />
              </button>
            )}
            <div className="vz-quadro">
              {/* key: a troca de imagem refaz a animação de entrada */}
              <img
                key={img.slug}
                src={urlImagem(img, img.larguras.find((l) => l >= 1200) ?? img.larguras[img.larguras.length - 1])}
                srcSet={srcSet(img)}
                sizes="(min-width: 768px) calc(100vw - 180px), 100vw"
                width={img.largura}
                height={img.altura}
                alt={img.alt}
                className="vz-imagem"
                onPointerDown={tocar}
                onPointerMove={arrastarZoom}
                onPointerUp={soltar}
                onPointerCancel={soltar}
                onPointerLeave={() => setLupaAtiva(false)}
                draggable={false}
              />
              <div
                ref={lupa}
                aria-hidden="true"
                className="vz-lupa"
                data-ativa={lupaAtiva || undefined}
                style={{ width: LUPA, height: LUPA, backgroundImage: `url(${urlImagem(img, img.larguras[img.larguras.length - 1])})` }}
              />
            </div>
            {total > 1 && (
              <button type="button" onClick={() => ir(1)} className="vz-botao vz-seta" aria-label="Próxima imagem">
                <Seta />
              </button>
            )}
          </div>

          <div className="vz-legenda">
            {img.titulo && <p className="font-display text-[22px] leading-tight text-paper">{img.titulo}</p>}
            <p className="mt-1 text-[14px] text-paper/70">
              <Legenda img={img} />
            </p>
          </div>

          {total > 1 && (
            <ul className="vz-miniaturas" aria-label="Miniaturas">
              {imagens.map((m, i) => (
                <li key={m.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      atualizarUrlImagem(m.slug);
                      aoVer(i);
                    }}
                    aria-label={`Ver ${m.titulo ?? m.alt}`}
                    aria-current={i === indice || undefined}
                    className="vz-miniatura"
                  >
                    <img src={urlImagem(m, m.larguras[0])} alt="" width={m.largura} height={m.altura} loading="lazy" decoding="async" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </dialog>
  );
}
