"use client";

import dynamic from "next/dynamic";
import { useState, type ComponentProps } from "react";

// O lightbox (biblioteca + estilos) só é baixado quando alguém abre a primeira imagem:
// a página fica mais leve e a ilustração principal aparece antes no celular.
const Visualizador = dynamic(() => import("./Visualizador").then((m) => m.Visualizador), { ssr: false });

type Props = ComponentProps<typeof import("./Visualizador").Visualizador>;

export function VisualizadorSobDemanda(props: Props) {
  const [usado, setUsado] = useState(false);
  if (!usado && props.indice >= 0) setUsado(true);
  return usado ? <Visualizador {...props} /> : null;
}
