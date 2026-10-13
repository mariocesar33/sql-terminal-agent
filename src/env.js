// =============================================================================
// env.js — CONFIGURAÇÃO (variáveis de ambiente)
//
// Lê o ficheiro .env, valida o que lá está e exporta um objeto "env" limpo.
// O resto do código importa { env } daqui, em vez de ler process.env à mão.
//
// Variáveis (ver .env.example):
//   OPENAI_API_KEY / GEMINI_API_KEY  -> chaves das IAs (pelo menos UMA)
//   OPENAI_MODEL / GEMINI_MODEL      -> opcional: trocar o modelo usado
//
// Usado por: providers.js. As chaves ficam no .env, que NÃO vai para o Git
// (ver .gitignore), para não expor segredos.
// =============================================================================

import { z } from "zod"

// Carrega o ficheiro .env (Node 20.12+). Se não existir, usa as variáveis
// que já estiverem no ambiente do sistema.
try {
  process.loadEnvFile()
} catch {
  // sem .env: segue com process.env
}

// Trata strings vazias (ex.: GEMINI_API_KEY="") como "não definida".
const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
)

// Descreve, com zod, quais variáveis aceitamos e como validá-las.
// Se algo estiver mal configurado, falhamos logo no arranque com uma
// mensagem clara (fail fast), em vez de um erro estranho mais tarde.
const envSchema = z
  .object({
    OPENAI_API_KEY: optionalString,
    GEMINI_API_KEY: optionalString,
    OPENAI_MODEL: optionalString,
    GEMINI_MODEL: optionalString,
  })
  // Regra extra: tem de existir pelo menos uma das duas chaves.
  .refine((env) => env.OPENAI_API_KEY || env.GEMINI_API_KEY, {
    message:
      "Define pelo menos uma chave no ficheiro .env: OPENAI_API_KEY ou GEMINI_API_KEY",
    path: ["OPENAI_API_KEY"],
  })

// safeParse valida sem lançar exceção: devolve { success, data | error }.
const result = envSchema.safeParse(process.env)

// Configuração inválida: mostra o que falta e termina o programa.
if (!result.success) {
  console.error("Variáveis de ambiente inválidas:")
  for (const issue of result.error.issues) {
    console.error(`- ${issue.path.join(".")}: ${issue.message}`)
  }
  process.exit(1)
}

// Objeto validado, pronto a usar no resto do projeto.
export const env = result.data
