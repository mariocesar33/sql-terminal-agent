import { openai } from "@ai-sdk/openai"
import { generateText, Output } from "ai"
import { z } from "zod"

const model = openai({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateSqlObject(question) {
  const { experimental_output } = await generateText({
    model,
    experimental_output: Output.object({ schema: sqlSuggestionSchema }),
    system: `
      Você é um assistente especialista em SQLite.

      Sua tarefa é gerar uma única query SQL para responder pergunta do(a) usuário(a).

      Regras obrigatórias:
      - Gere apenas SELECT.
      - Use apenas a tabela access_logs.
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
    throw new Error("O modelo nao retornou uma sugestão SQL valida.")
  }

  return {
    sql: validateSql(experimental_output.sql),
    explanation: experimental_output.explanation,
  }
}
