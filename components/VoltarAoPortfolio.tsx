"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

// Se a pessoa veio do portfólio, volta no histórico (o portfólio restaura filtro,
// quantidade carregada e scroll). Se chegou direto pelo link, vai para /portfolio/.
export function VoltarAoPortfolio() {
  const router = useRouter();
  return (
    <Link
      href="/portfolio/"
      onClick={(e) => {
        let veio = false;
        try {
          veio = sessionStorage.getItem("portfolio:veio") === "1";
          sessionStorage.removeItem("portfolio:veio");
        } catch {}
        if (veio && history.length > 1) {
          e.preventDefault();
          router.back();
        }
      }}
      className="text-[16px] font-bold"
    >
      ← Voltar ao portfólio
    </Link>
  );
}
