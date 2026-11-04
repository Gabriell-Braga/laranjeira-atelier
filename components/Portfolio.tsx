"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { atualizarUrlImagem, slugDaUrl, Visualizador } from "./Visualizador";

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

function Pilulas({ rotulo, opcoes, atual, aoEscolher }: { rotulo: string; opcoes: Opcao[]; atual?: string; aoEscolher: (v?: string) => void }) {
  return (
    <div role="group" aria-label={rotulo} className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[15px] font-bold text-ink-muted">{rotulo}</span>
      {opcoes.map((o) => {
        const ativo = atual === o.valor;
        return (
          <button
            key={o.valor}
            type="button"
            aria-pressed={ativo}
            onClick={() => aoEscolher(ativo ? undefined : o.valor)}
            className={`rounded-full border-2 border-vereda px-4 py-1.5 text-[16px] font-bold transition-colors ${
              ativo ? "bg-vereda text-white" : "text-vereda hover:bg-vereda/10"
            }`}
          >
            {o.rotulo}
          </button>
        );
      })}
    </div>
  );
}

export function Portfolio({ inicial, total, tipos, tecnicas, series }: Props) {
  const [indice, setIndice] = useState<ItemIndice[] | null>(null);
  const [filtros, setFiltros] = useState<Filtros>({ ordem: "destaques" });
  const [visiveis, setVisiveis] = useState(POR_LEVA);
  const [levasAuto, setLevasAuto] = useState(0);
  const [abertoSlug, setAbertoSlug] = useState<string | null>(null);
  const [anuncio, setAnuncio] = useState("");
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

  const mudarFiltros = (novo: Filtros) => {
    carregarIndice().then(() => {
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

  return (
    <>
      <div className="space-y-4 border-y border-linha py-6">
        <Pilulas rotulo="Tipo" opcoes={tipos} atual={filtros.tipo} aoEscolher={(tipo) => mudarFiltros({ ...filtros, tipo, serie: undefined })} />
        <Pilulas rotulo="Técnica" opcoes={tecnicas} atual={filtros.tecnica} aoEscolher={(tecnica) => mudarFiltros({ ...filtros, tecnica })} />
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-[16px]">
          <label className="flex items-center gap-2">
            <span className="font-bold text-ink-muted">Série</span>
            <select
              value={filtros.serie ?? ""}
              onChange={(e) => mudarFiltros({ ...filtros, serie: e.target.value || undefined })}
              className="rounded-full border-2 border-linha bg-surface px-4 py-1.5"
            >
              <option value="">Todas</option>
              {seriesDoTipo.map((s) => (
                <option key={s.valor} value={s.valor}>
                  {s.rotulo}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="font-bold text-ink-muted">Ordem</span>
            <select
              value={filtros.ordem}
              onChange={(e) => mudarFiltros({ ...filtros, ordem: e.target.value as Ordem })}
              className="rounded-full border-2 border-linha bg-surface px-4 py-1.5"
            >
              {Object.entries(ORDENS).map(([v, r]) => (
                <option key={v} value={v}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          {temFiltro(filtros) && (
            <button type="button" onClick={() => mudarFiltros({ ordem: "destaques" })} className="font-bold text-vereda underline underline-offset-4">
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      <p className="mt-6 font-display text-[24px]" aria-live="polite">
        {[...(resumo.length ? resumo : ["Todos"]), plural(totalLista)].join(" · ")}
      </p>

      {totalLista === 0 ? (
        <p className="mt-6 text-ink-muted">Nenhum trabalho com esses filtros.</p>
      ) : (
        <div className="alvenaria mt-6">
          <ul className="alvenaria-area list-none p-0" style={estiloArea(layouts)}>
            {exibidos.map((it, i) => {
              const conteudo = (
                <>
                  <Imagem
                    img={it}
                    sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
                    maxLargura={960}
                    prioridade={i < 3}
                    className="h-full w-full object-cover"
                  />
                  {it.selo && (
                    <span className="absolute left-3 top-3 rounded-full bg-paper px-3 py-1 text-[14px] font-bold text-ink">{it.selo}</span>
                  )}
                </>
              );
              const classe = "relative block h-full w-full rounded-[4px]";
              return (
                <li key={it.slug} className="alvenaria-item" style={estiloItem(layouts, i, it.altura / it.largura)}>
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
                      className={`${classe} cursor-zoom-in`}
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

      <div ref={sentinela} aria-hidden="true" />
      <p className="sr-only" aria-live="polite">
        {anuncio}
      </p>

      <div className="mt-10 text-center">
        {restam ? (
          <button
            type="button"
            onClick={() => carregarMais(false)}
            className="rounded-full border-2 border-vereda px-6 py-3 text-[17px] font-bold text-vereda hover:bg-vereda hover:text-white"
          >
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
