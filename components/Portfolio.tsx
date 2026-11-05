"use client";

import Link from "next/link";
import type React from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { calcularLayouts, estiloArea, estiloItem } from "@/lib/alvenaria";
import {
  buscaDosFiltros,
  filtrar,
  filtrosDaUrl,
  ORDENS,
  POR_LEVA,
  temFiltro,
  type Filtros,
  type ItemIndice,
  type Ordem,
} from "@/lib/portfolio-indice";
import { Imagem } from "./Imagem";
import { atualizarUrlImagem, slugDaUrl } from "@/lib/url-imagem";
import { VisualizadorSobDemanda as Visualizador } from "./VisualizadorSobDemanda";

const LEVAS_AUTOMATICAS = 5;
const MARGEM_AUTOMATICA = "800px 0px";
const CHAVE = "portfolio:"; // sessionStorage: quantidade carregada e posição do scroll por filtro

type Opcao = { valor: string; rotulo: string };

type Props = {
  /** primeiros itens, já no HTML estático (ordem Destaques, sem filtro) */
  inicial: ItemIndice[];
  total: number;
  tipos: Opcao[];
  tecnicas: Opcao[];
  series: (Opcao & { tipo: string })[];
};

let indiceEmMemoria: Promise<ItemIndice[]> | null = null;
const baixarIndice = () =>
  (indiceEmMemoria ??= fetch("/portfolio/indice.json").then((r) => {
    if (!r.ok) throw new Error("índice do portfólio indisponível");
    return r.json();
  }));

const plural = (n: number) => `${n} ${n === 1 ? "trabalho" : "trabalhos"}`;

function Pilula({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[15px] font-bold transition-colors duration-200 ${
        ativo ? "border-vereda bg-vereda text-paper" : "border-linha bg-surface text-ink hover:border-vereda hover:text-vereda"
      }`}
    >
      {children}
    </button>
  );
}

const reduzMovimento = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export function Portfolio({ inicial, total, tipos, tecnicas, series }: Props) {
  const [indice, setIndice] = useState<ItemIndice[] | null>(null);
  const [filtros, setFiltros] = useState<Filtros>({ ordem: "destaques" });
  const [visiveis, setVisiveis] = useState(POR_LEVA);
  const [levasAuto, setLevasAuto] = useState(0);
  const [abertoSlug, setAbertoSlug] = useState<string | null>(null);
  const [anuncio, setAnuncio] = useState("");
  const [painel, setPainel] = useState(false);
  const area = useRef<HTMLUListElement>(null);
  // FLIP: posições antes de trocar o filtro e itens que já estavam na grade
  const antes = useRef<Map<string, { x: number; y: number }> | null>(null);
  const jaVistos = useRef<Set<string>>(new Set(inicial.map((i) => i.slug)));
  const focarIndice = useRef<number | null>(null);
  const ultimoVisto = useRef<string | null>(null);
  const scrollPendente = useRef<number | null>(null);

  const carregarIndice = useCallback(() => baixarIndice().then((d) => (setIndice(d), d)), []);

  const lista = useMemo(() => (indice ? filtrar([...indice], filtros) : inicial), [indice, filtros, inicial]);
  const totalLista = indice ? lista.length : total;
  const exibidos = useMemo(() => lista.slice(0, visiveis), [lista, visiveis]);
  const layouts = useMemo(() => calcularLayouts(exibidos.map((i) => i.altura / i.largura)), [exibidos]);
  const imagensLightbox = useMemo(() => lista.filter((i) => !i.href), [lista]);
  const aberto = abertoSlug ? imagensLightbox.findIndex((i) => i.slug === abertoSlug) : -1;

  // Quantidade necessária para um item da lista estar na grade (arredonda para levas de 24).
  const garantirVisivel = useCallback((pos: number) => {
    if (pos >= 0) setVisiveis((v) => Math.max(v, Math.ceil((pos + 1) / POR_LEVA) * POR_LEVA));
  }, []);

  // Ao abrir a página: filtros da URL, ?imagem= e estado salvo ao sair para um projeto.
  useEffect(() => {
    const f = filtrosDaUrl(window.location.search);
    const slug = slugDaUrl();
    let salvo: { visiveis: number; y: number } | null = null;
    try {
      salvo = JSON.parse(sessionStorage.getItem(CHAVE + buscaDosFiltros(f)) ?? "null");
    } catch {}
    if (!temFiltro(f) && !slug && !salvo) return;
    carregarIndice().then((dados) => {
      setFiltros(f);
      const l = filtrar([...dados], f);
      let v = Math.max(POR_LEVA, salvo?.visiveis ?? 0);
      if (slug) {
        const pos = l.findIndex((i) => i.slug === slug);
        if (pos >= 0) {
          v = Math.max(v, Math.ceil((pos + 1) / POR_LEVA) * POR_LEVA);
          setAbertoSlug(slug);
        }
      }
      setVisiveis(v);
      if (salvo && !slug) scrollPendente.current = salvo.y;
    });
  }, [carregarIndice]);

  // Restaura o scroll depois que a grade com a quantidade salva foi desenhada.
  useEffect(() => {
    if (scrollPendente.current === null) return;
    const y = scrollPendente.current;
    scrollPendente.current = null;
    requestAnimationFrame(() => window.scrollTo(0, y));
  }, [exibidos]);

  // Depois de "Carregar mais", o foco vai para o primeiro item novo.
  useEffect(() => {
    if (focarIndice.current === null) return;
    const i = focarIndice.current;
    focarIndice.current = null;
    document.querySelector<HTMLElement>(`[data-pos="${i}"]`)?.focus();
  }, [exibidos]);

  const salvarEstado = useCallback(() => {
    try {
      sessionStorage.setItem(CHAVE + buscaDosFiltros(filtros), JSON.stringify({ visiveis, y: window.scrollY }));
    } catch {}
  }, [filtros, visiveis]);

  useEffect(() => {
    window.addEventListener("pagehide", salvarEstado);
    return () => window.removeEventListener("pagehide", salvarEstado);
  }, [salvarEstado]);

  const fotografar = () => {
    const mapa = new Map<string, { x: number; y: number }>();
    area.current?.querySelectorAll<HTMLElement>("[data-item]").forEach((el) => mapa.set(el.dataset.item!, { x: el.offsetLeft, y: el.offsetTop }));
    return mapa;
  };

  // Ao trocar o filtro, quem fica desliza da posição antiga para a nova (só transform);
  // quem entra aparece com fade e leve subida. "Carregar mais": só os novos aparecem.
  useLayoutEffect(() => {
    const ul = area.current;
    const velhas = antes.current;
    antes.current = null;
    if (!ul) return;
    const vistos = jaVistos.current;
    const animar = !reduzMovimento();
    let novos = 0;
    ul.querySelectorAll<HTMLElement>("[data-item]").forEach((el) => {
      const slug = el.dataset.item!;
      const v = velhas?.get(slug);
      if (animar && v) {
        const dx = v.x - el.offsetLeft;
        const dy = v.y - el.offsetTop;
        if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 550, easing: EASE });
      } else if (animar && (velhas || !vistos.has(slug))) {
        el.animate([{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], {
          duration: 500,
          easing: EASE,
          delay: Math.min(novos++, 8) * 45,
          fill: "backwards",
        });
      }
      vistos.add(slug);
    });
  }, [exibidos]);

  const mudarFiltros = (novo: Filtros) => {
    carregarIndice().then(() => {
      antes.current = fotografar();
      setFiltros(novo);
      setVisiveis(POR_LEVA);
      setLevasAuto(0);
      window.history.replaceState(window.history.state, "", window.location.pathname + buscaDosFiltros(novo));
    });
  };

  const carregarMais = useCallback(
    async (automatico: boolean) => {
      const dados = await carregarIndice();
      const totalAtual = filtrar([...dados], filtros).length;
      const novo = Math.min(visiveis + POR_LEVA, totalAtual);
      setAnuncio(`${novo - visiveis} trabalhos carregados, ${novo} de ${totalAtual}.`);
      if (!automatico) focarIndice.current = visiveis;
      setVisiveis(novo);
      if (automatico) setLevasAuto((n) => n + 1);
    },
    [carregarIndice, filtros, visiveis],
  );

  // Carregamento automático ao chegar perto do fim (até 5 levas seguidas).
  const sentinela = useRef<HTMLDivElement>(null);
  const restam = visiveis < totalLista;
  useEffect(() => {
    if (!sentinela.current || !restam || levasAuto >= LEVAS_AUTOMATICAS) return;
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          obs.disconnect();
          carregarMais(true);
        }
      },
      { rootMargin: MARGEM_AUTOMATICA },
    );
    obs.observe(sentinela.current);
    return () => obs.disconnect();
  }, [restam, levasAuto, visiveis, carregarMais]);

  const abrir = (slug: string) => {
    ultimoVisto.current = slug;
    setAbertoSlug(slug);
    atualizarUrlImagem(slug);
    carregarIndice(); // o lightbox navega por todos os itens do filtro, não só os carregados
  };

  const resumo = [
    tipos.find((t) => t.valor === filtros.tipo)?.rotulo,
    tecnicas.find((t) => t.valor === filtros.tecnica)?.rotulo,
    series.find((s) => s.valor === filtros.serie)?.rotulo,
  ].filter(Boolean);
  const seriesDoTipo = series.filter((s) => !filtros.tipo || s.tipo === filtros.tipo);

  const ativosNoPainel = [filtros.tecnica, filtros.serie, filtros.ordem !== "destaques" ? filtros.ordem : undefined].filter(Boolean).length;
  const limpar = () => mudarFiltros({ ordem: "destaques", tipo: filtros.tipo });

  return (
    <>
      {/* Barra de filtros: fica presa logo abaixo do cabeçalho ao rolar a grade */}
      <div className="sticky top-[63px] z-30 border-y border-linha bg-paper/90 backdrop-blur-md">
        <div className="conteudo flex items-center gap-3 py-3">
          <div
            role="group"
            aria-label="Categoria"
            className="-my-1 flex min-w-0 flex-1 gap-2 overflow-x-auto py-1 pr-6 [mask-image:linear-gradient(to_right,#000_calc(100%-28px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <Pilula ativo={!filtros.tipo} onClick={() => mudarFiltros({ ...filtros, tipo: undefined, serie: undefined })}>
              Todos
            </Pilula>
            {tipos.map((t) => (
              <Pilula
                key={t.valor}
                ativo={filtros.tipo === t.valor}
                onClick={() => mudarFiltros({ ...filtros, tipo: filtros.tipo === t.valor ? undefined : t.valor, serie: undefined })}
              >
                {t.rotulo}
              </Pilula>
            ))}
          </div>
          <button
            type="button"
            aria-expanded={painel}
            aria-controls="painel-filtros"
            onClick={() => setPainel((p) => !p)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[15px] font-bold transition-colors duration-200 ${
              painel || ativosNoPainel ? "border-vereda text-vereda" : "border-linha bg-surface text-ink hover:border-vereda hover:text-vereda"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M2 4h12M4.5 8h7M7 12h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Filtros
            {ativosNoPainel > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-vereda px-1 text-[12px] text-paper">
                {ativosNoPainel}
                <span className="sr-only"> ativos</span>
              </span>
            )}
          </button>
        </div>

        <div id="painel-filtros" hidden={!painel} className="border-t border-linha">
          <div className="conteudo grid gap-x-10 gap-y-5 py-5 text-[15px] md:grid-cols-[auto_auto_auto_1fr] md:items-end">
            <div role="group" aria-label="Técnica">
              <p className="mb-2 font-bold text-ink-muted">Técnica</p>
              <div className="flex flex-wrap gap-2">
                {tecnicas.map((t) => (
                  <Pilula
                    key={t.valor}
                    ativo={filtros.tecnica === t.valor}
                    onClick={() => mudarFiltros({ ...filtros, tecnica: filtros.tecnica === t.valor ? undefined : t.valor })}
                  >
                    {t.rotulo}
                  </Pilula>
                ))}
              </div>
            </div>
            {seriesDoTipo.length > 0 && (
              <label className="block">
                <span className="mb-2 block font-bold text-ink-muted">Série</span>
                <select
                  value={filtros.serie ?? ""}
                  onChange={(e) => mudarFiltros({ ...filtros, serie: e.target.value || undefined })}
                  className="w-full rounded-full border border-linha bg-surface px-4 py-2 md:w-auto"
                >
                  <option value="">Todas</option>
                  {seriesDoTipo.map((s) => (
                    <option key={s.valor} value={s.valor}>
                      {s.rotulo}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="block">
              <span className="mb-2 block font-bold text-ink-muted">Ordem</span>
              <select
                value={filtros.ordem}
                onChange={(e) => mudarFiltros({ ...filtros, ordem: e.target.value as Ordem })}
                className="w-full rounded-full border border-linha bg-surface px-4 py-2 md:w-auto"
              >
                {Object.entries(ORDENS).map(([v, r]) => (
                  <option key={v} value={v}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <div className="md:text-right">
              <button type="button" onClick={limpar} disabled={!ativosNoPainel} className="link-seta py-2 disabled:opacity-40">
                <span>Limpar filtros</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="conteudo">
      <p className="mt-6 text-[15px] text-ink-muted" aria-live="polite">
        {[...(resumo.length ? resumo : ["Todos"]), plural(totalLista)].join(" · ")}
      </p>

      {totalLista === 0 ? (
        <p className="mt-6 text-ink-muted">Nenhum trabalho com esses filtros.</p>
      ) : (
        <div className="alvenaria mt-6">
          <ul ref={area} className="alvenaria-area list-none p-0" style={estiloArea(layouts)}>
            {exibidos.map((it, i) => {
              const conteudo = (
                <>
                  <Imagem
                    img={it}
                    sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, calc(100vw - 40px)"
                    maxLargura={960}
                    prioridade={i < 3}
                    className="h-full w-full object-cover"
                  />
                  {it.titulo && <span className="obra-legenda">{it.titulo}</span>}
                  {it.selo && (
                    <span className="absolute left-3 top-3 rounded-full bg-paper px-3 py-1 text-[14px] font-bold text-ink">{it.selo}</span>
                  )}
                </>
              );
              const classe = "obra relative block h-full w-full rounded-[4px]";
              return (
                <li key={it.slug} data-item={it.slug} className="alvenaria-item" style={estiloItem(layouts, i, it.altura / it.largura)}>
                  {it.href ? (
                    <Link
                      href={it.href}
                      onClick={() => {
                        salvarEstado();
                        try {
                          sessionStorage.setItem("portfolio:veio", "1");
                        } catch {}
                      }} data-pos={i} className={classe} aria-label={`${it.selo ?? "Abrir"}: ${it.titulo ?? it.alt}`}>
                      {conteudo}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      data-pos={i}
                      data-slug={it.slug}
                      onClick={() => abrir(it.slug)}
                      className={`${classe} cursor-pointer`}
                      aria-label={`Ampliar: ${it.titulo || it.alt}`}
                    >
                      {conteudo}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      </div>
      <div ref={sentinela} aria-hidden="true" />
      <p className="sr-only" aria-live="polite">
        {anuncio}
      </p>

      <div className="conteudo mt-12 text-center">
        {restam ? (
          <button type="button" onClick={() => carregarMais(false)} className="botao border-2 border-vereda text-vereda hover:bg-vereda hover:text-paper">
            Carregar mais trabalhos
          </button>
        ) : (
          totalLista > 0 && <p className="text-ink-muted">Você viu todos os {plural(totalLista)}.</p>
        )}
      </div>

      <Visualizador
        imagens={imagensLightbox}
        indice={aberto}
        aoVer={(i) => {
          const it = imagensLightbox[i];
          ultimoVisto.current = it.slug;
          setAbertoSlug(it.slug);
          garantirVisivel(lista.indexOf(it)); // a grade acompanha o lightbox
        }}
        aoFechar={() => setAbertoSlug(null)}
        aoSair={() => {
          // Foco e scroll voltam para o último item visto no lightbox.
          const el = document.querySelector<HTMLElement>(`[data-slug="${ultimoVisto.current}"]`);
          el?.focus({ preventScroll: true });
          el?.scrollIntoView({ block: "center" });
        }}
      />
    </>
  );
}
