// =============================================================================
// chooseProvider.js — escolher a IA no arranque
//
// Se só houver uma chave configurada, usa essa IA sem perguntar. Se houver
// várias, mostra um menu no terminal. Devolve o id escolhido ("openai"/"gemini"),
// que depois é passado ao ai.js.
//
// Usado por: index.js (no arranque) e pelo teste rápido no fim de ai.js.
// =============================================================================

// readline/promises: ler o que o utilizador escreve no terminal, com await.
import { createInterface } from "node:readline/promises"
// Lista dos provedores que têm chave no .env (ver providers.js).
import { getAvailableProviders } from "./providers.js"

// Se só houver um provedor com chave, usa-o; se houver vários, pergunta.
export async function chooseProvider() {
  const available = getAvailableProviders()

  if (available.length === 0) {
    throw new Error("Nenhum provedor de IA com chave configurada no .env.")
  }

  if (available.length === 1) {
    return available[0].id
  }

  // Só criamos a interface de leitura se for mesmo preciso perguntar.
  const rl = createInterface({ input: process.stdin, output: process.stdout })

  try {
    console.log("Provedores de IA disponíveis:")
    available.forEach((provider, index) => {
      console.log(`  ${index + 1}) ${provider.label} (${provider.model})`)
    })

    // Repete até o utilizador escolher um número válido do menu.
    while (true) {
      const answer = await rl.question("Escolhe o provedor (número): ")
      const choice = available[Number(answer.trim()) - 1]

      if (choice) return choice.id
      console.log("Opção inválida, tenta outra vez.")
    }
    // Aconteça o que acontecer, fecha a leitura do terminal.
  } finally {
    rl.close()
  }
}
