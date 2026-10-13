// =============================================================================
// agent.js — PONTO DE ENTRADA do agente (npm start)
//
// É o REPL (ler-avaliar-responder em ciclo): lê uma pergunta no terminal,
// responde, e volta a perguntar. Junta todas as peças do projeto.
//
// VISÃO GERAL DO PROJETO — o caminho dos dados:
//
//   npm run seed    seed.js    gera o access.log (stream de ESCRITA)
//         |
//         v
//   npm run ingest  ingest.js  lê o access.log (stream de LEITURA, linha a
//         |                    linha) e guarda no SQLite (db.js)
//         v
//   npm start       agent.js   (este ficheiro) responde a perguntas:
//
//     pergunta do utilizador
//         |  A) ai.js generateSqlObject: a IA gera um SELECT
//         |     (usa providers.js + schemaDescription.js)
//         |  validateSql.js: valida o SQL (segurança)
//         |  B) db.js / SQLite: executa o SQL e obtém as linhas
//         |  C) ai.js generateAnswer: a IA transforma as linhas numa resposta
//         v
//     resposta no terminal
//
//   Configuração: env.js (.env)    Constantes: utils/constantes.js
//   Erros amigáveis: lib/formatError.js
// =============================================================================

import { existsSync } from "node:fs"
import { createInterface } from "node:readline/promises"
import { createdb } from "./db.js"
import { generateAnswer, generateSqlObject } from "./lib/ai.js"
import { chooseProvider } from "./lib/chooseProvider.js"
import { formatError } from "./lib/formatError.js"
import { dbFile, tableName } from "./utils/constantes.js"

// Palavras que o utilizador pode escrever para sair.
const exitCommands = ["sair", "exit", "quit"]

// Antes de começar: a base de dados tem de existir (criada pelo ingest.js).
// Verificamos primeiro, porque createdb() criaria um ficheiro vazio.
if (!existsSync(dbFile)) {
  console.error(
    `Base de dados ${dbFile} não encontrada. Corre primeiro: npm run seed e npm run ingest`,
  )
  process.exit(1)
}

// Abre a base de dados e conta quantos registos tem.
const db = createdb(dbFile)
const { total } = db.prepare(`SELECT COUNT(*) AS total FROM ${tableName}`).get()

// Base vazia: não há nada para perguntar, avisa e termina.
if (total === 0) {
  console.error(
    "A base de dados está vazia. Corre primeiro: npm run seed e npm run ingest",
  )
  process.exit(1)
}

// Escolhe a IA (OpenAI ou Gemini). Pergunta ao utilizador se houver as duas.
const providerId = await chooseProvider()

// Interface para ler as perguntas escritas no terminal.
const rl = createInterface({ input: process.stdin, output: process.stdout })

// Ctrl+C ou fim do input: fecha tudo e sai.
// Quando a leitura termina (Ctrl+C, ou rl.close() no fim), fecha a base de
// dados e sai do programa.
rl.on("close", () => {
  db.close()
  console.log("\nAté já!")
  process.exit(0)
})

console.log(
  `\nAgente SQL pronto (${total.toLocaleString()} registos, provedor: ${providerId}).`,
)
console.log('Escreve a tua pergunta, ou "sair" para terminar.')

// CICLO PRINCIPAL: uma volta por pergunta, até o utilizador escrever "sair".
while (true) {
  // Espera (await) que o utilizador escreva e carregue em Enter.
  const question = (await rl.question("\n> ")).trim()

  // Enter sem texto: pergunta outra vez.
  if (!question) continue
  if (exitCommands.includes(question.toLowerCase())) break

  // Qualquer erro dentro deste bloco (IA, SQL, base de dados) é apanhado no
  // catch e mostrado de forma curta, sem fechar o programa.
  try {
    // A) A IA gera o SQL (já validado) e uma explicação do que ele faz.
    const { sql, explanation } = await generateSqlObject(question, providerId)
    console.log(`\nSQL: ${sql}`)
    console.log(explanation)

    // B) Executa o SQL na base de dados. .all() devolve todas as linhas.
    const rows = db.prepare(sql).all()
    console.log(`\n${rows.length} registo(s) encontrado(s).`)

    // C) A IA escreve a resposta final, a partir das linhas encontradas.
    const answer = await generateAnswer({ question, sql, rows, providerId })
    console.log(`\n${answer}`)
  } catch (error) {
    // formatError.js transforma o erro numa frase que se percebe.
    console.error(`\n${formatError(error)}`)
  }
}

// Saímos do ciclo (o utilizador escreveu "sair"): fecha a leitura, o que
// dispara o rl.on("close") acima.
rl.close()
