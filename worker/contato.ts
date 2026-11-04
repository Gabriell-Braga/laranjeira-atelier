// Validação do formulário de contato. Sem dependências: roda no Worker e no Node (teste no fim).

export const ASSUNTOS = ["Encomenda de ilustração", "Projeto editorial", "Compra para escola ou livraria", "Outro"] as const;

export type Mensagem = { nome: string; email: string; assunto: string; mensagem: string };
export type Resultado = { ok: true; dados: Mensagem } | { ok: false; erros: Partial<Record<keyof Mensagem | "geral", string>> };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validar(entrada: Record<string, unknown>): Resultado {
  const texto = (k: string) => (typeof entrada[k] === "string" ? (entrada[k] as string).trim() : "");
  const dados: Mensagem = { nome: texto("nome"), email: texto("email"), assunto: texto("assunto"), mensagem: texto("mensagem") };
  const erros: Partial<Record<keyof Mensagem, string>> = {};
  if (dados.nome.length < 2) erros.nome = "Escreva seu nome.";
  else if (dados.nome.length > 120) erros.nome = "O nome pode ter no máximo 120 caracteres.";
  if (!EMAIL.test(dados.email) || dados.email.length > 200) erros.email = "Escreva um e-mail válido, como nome@exemplo.com.";
  if (!(ASSUNTOS as readonly string[]).includes(dados.assunto)) erros.assunto = "Escolha um assunto.";
  if (dados.mensagem.length < 10) erros.mensagem = "Escreva sua mensagem (pelo menos 10 caracteres).";
  else if (dados.mensagem.length > 5000) erros.mensagem = "A mensagem pode ter no máximo 5.000 caracteres.";
  return Object.keys(erros).length ? { ok: false, erros } : { ok: true, dados };
}

// Teste rápido: node worker/contato.ts
if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("contato.ts")) {
  const ok = validar({ nome: "Ana", email: "ana@exemplo.com", assunto: "Outro", mensagem: "Olá, gostaria de saber mais." });
  console.assert(ok.ok, "mensagem válida deve passar");
  const ruim = validar({ nome: " ", email: "ana@", assunto: "Spam", mensagem: "oi" });
  console.assert(!ruim.ok && Object.keys(ruim.erros).length === 4, "quatro erros esperados");
  const injecao = validar({ nome: "Ana", email: "ana@exemplo.com\nbcc: x@y.com", assunto: "Outro", mensagem: "mensagem longa" });
  console.assert(!injecao.ok, "e-mail com quebra de linha deve falhar");
  console.log("contato: ok");
}
