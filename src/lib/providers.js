// =============================================================================
// providers.js — os PROVEDORES de IA (OpenAI, Gemini) num só sítio
//
// Ideia: o resto do código não sabe qual IA está a usar. Pede um "model"
// através de getModel("openai" | "gemini") e usa-o com o AI SDK (ver ai.js).
// Assim, o programa funciona com qualquer chave válida.
//
// Usado por: chooseProvider.js (que provedores existem) e ai.js (o model).
// =============================================================================

// Pacotes do AI SDK da Vercel: cada um sabe falar com a API de um provedor.
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"
// Chaves e modelos já validados (ver env.js).
import { env } from "../env.js"

// Para acrescentar outro provedor, basta uma nova entrada aqui.
const providers = {
  // Cada provedor tem: id, nome para mostrar, chave, modelo e uma função
  // (createModel) que, com a chave e o nome do modelo, devolve o objeto "model"
  // que o AI SDK entende. O modelo usa o valor do .env ou, se faltar, o padrão.
  openai: {
    id: "openai",
    label: "OpenAI",
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL ?? "gpt-4o-mini",
    createModel: (apiKey, model) => createOpenAI({ apiKey })(model),
  },
  gemini: {
    id: "gemini",
    label: "Gemini",
    apiKey: env.GEMINI_API_KEY,
    model: env.GEMINI_MODEL ?? "gemini-3.8-flash",
    createModel: (apiKey, model) => createGoogleGenerativeAI({ apiKey })(model),
  },
}

// Provedores que têm chave configurada no .env.
export function getAvailableProviders() {
  return Object.values(providers)
    .filter((provider) => provider.apiKey)
    .map(({ id, label, model }) => ({ id, label, model }))
}

// Devolve o "model" pronto a passar ao generateText (ver ai.js), depois de
// confirmar que o provedor existe e tem chave.
export function getModel(providerId) {
  const provider = providers[providerId]

  if (!provider) {
    throw new Error(`Provedor desconhecido: ${providerId}`)
  }

  if (!provider.apiKey) {
    throw new Error(
      `O provedor ${provider.label} não tem chave configurada no .env.`,
    )
  }

  return provider.createModel(provider.apiKey, provider.model)
}
