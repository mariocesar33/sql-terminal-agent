import { createOpenAI } from "@ai-sdk/openai"
import { generateText, Output } from "ai"
import { z } from "zod"
import { env } from "../env.js"

const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY })
const model = openai("gpt-4o-mini")

const TABLE_NAME = "accessLogs"
const DEFAULT_LIMIT = 100

const BLOCKED_KEYWORDS = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "DROP",
  "ALTER",
  "CREATE",
  "REPLACE",
  "TRUNCATE",
  "ATTACH",
  "DETACH",
  "PRAGMA",
  "VACUUM",
  "REINDEX",
]

const SCHEMA_DESCRIPTION = `
  Tabela ${TABLE_NAME} (um registo por acesso):
  - logId INTEGER: identificador único da linha
  - ip TEXT: endereço IP do utilizador
  - username TEXT: nome de utilizador
  - firstName TEXT: primeiro nome
  - lastName TEXT: apelido
  - email TEXT: email
  - location TEXT: cidade
  - jobArea TEXT: área profissional
  - company TEXT: empresa
  - jobTitle TEXT: cargo
  - id TEXT: identificador do utilizador (repete-se em vários acessos)
  - timestamp TIMESTAMP: data e hora do acesso, texto ISO 8601 em UTC
    (ex.: 2026-10-12T08:00:00.000Z). Usa date() ou datetime() do SQLite
    para filtrar por datas.
`

const sqlSuggestionSchema = z.object({
  sql: z.string().describe("Uma única query SELECT em SQLite"),
  explanation: z
    .string()
    .describe("Explicação curta do que a query faz, em português"),
})

export function validateSql(sql) {
  // Remove espaços e um único ";" final, que é inofensivo.
  const query = sql.trim().replace(/;\s*$/, "")

  if (!/^select\b/i.test(query)) {
    throw new Error("SQL rejeitado: só são permitidas queries SELECT.")
  }

  if (query.includes(";")) {
    throw new Error("SQL rejeitado: não são permitidas várias queries.")
  }

  if (query.includes("--") || query.includes("/*")) {
    throw new Error("SQL rejeitado: não são permitidos comentários.")
  }

  const blocked = new RegExp(`\\b(${BLOCKED_KEYWORDS.join("|")})\\b`, "i")
  const found = query.match(blocked)
  if (found) {
    throw new Error(`SQL rejeitado: palavra não permitida (${found[1]}).`)
  }

  for (const [, table] of query.matchAll(/\b(?:from|join)\s+([\w.]+)/gi)) {
    if (table.toLowerCase() !== TABLE_NAME.toLowerCase()) {
      throw new Error(`SQL rejeitado: tabela não permitida (${table}).`)
    }
  }

  // Garante um limite de linhas para não devolver a tabela inteira.
  return /\blimit\b/i.test(query)
    ? query
    : `${query} LIMIT ${DEFAULT_LIMIT}`
}

export async function generateSqlObject(question) {
  const { experimental_output } = await generateText({
    model,
    experimental_output: Output.object({ schema: sqlSuggestionSchema }),
    system: `
      Você é um assistente especialista em SQLite.

      Sua tarefa é gerar uma única query SQL para responder à pergunta do(a) usuário(a).

      Regras obrigatórias:
      - Gere apenas SELECT.
      - Use apenas a tabela ${TABLE_NAME}.
      - Não use ${BLOCKED_KEYWORDS.join(", ")}.
      - Não gere múltiplas queries.
      - Não use comentários SQL.
      - Se a pergunta não puder ser respondida com o schema disponível, gere uma query simples de inspeção ou explique a limitação.

      Schema disponível:
      ${SCHEMA_DESCRIPTION}`,
    prompt: `
      Pergunta do usuário:
      ${question}
    `,
  })

  if (!experimental_output?.sql) {
    throw new Error("O modelo não retornou uma sugestão SQL válida.")
  }

  return {
    sql: validateSql(experimental_output.sql),
    explanation: experimental_output.explanation,
  }
}
