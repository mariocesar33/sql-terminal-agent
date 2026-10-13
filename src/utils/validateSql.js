// =============================================================================
// validateSql.js — a BARREIRA DE SEGURANÇA entre a IA e a base de dados
//
// Porquê: o SQL vem de uma IA, que pode errar ou ser manipulada (por exemplo,
// com instruções escondidas na pergunta ou nos dados: "prompt injection").
// Nunca executamos esse SQL sem o validar.
//
// As regras no prompt (ai.js) são só um PEDIDO à IA, que pode ignorá-las.
// Estas verificações em código são a garantia real.
//
// Usada por: ai.js (generateSqlObject), antes de devolver o SQL ao agent.js.
// =============================================================================

// Lista de palavras proibidas (ver blockedKeywords.js).
import { blockedKeywords } from "./blockedKeywords.js"
// tableName: única tabela permitida. queryLimit: máximo de linhas.
import { queryLimit, tableName } from "./constantes.js"

// Recebe o SQL sugerido pela IA. Devolve o SQL pronto a executar (com LIMIT
// se faltava) ou lança um erro "SQL rejeitado: ..." que o agent.js mostra
// ao utilizador (via formatError.js).
export function validateSql(sql) {
  // Remove espaços e um único ";" final, que é inofensivo.
  const query = sql.trim().replace(/;\s*$/, "")

  // Regra 1: tem de começar por SELECT (só leitura).
  if (!/^select\b/i.test(query)) {
    throw new Error("SQL rejeitado: só são permitidas queries SELECT.")
  }

  // Regra 2: um ";" a meio permitiria 2 comandos, por exemplo
  // "SELECT ...; DROP TABLE accessLogs".
  if (query.includes(";")) {
    throw new Error("SQL rejeitado: não são permitidas várias queries.")
  }

  // Regra 3: sem comentários SQL (podem esconder partes da query).
  if (query.includes("--") || query.includes("/*")) {
    throw new Error("SQL rejeitado: não são permitidos comentários.")
  }

  // Regra 4: sem palavras proibidas. Monta uma expressão regular como
  // \b(INSERT|UPDATE|...)\b: o \b marca fronteira de palavra e o "i" ignora
  // maiúsculas/minúsculas.
  const blocked = new RegExp(`\\b(${blockedKeywords.join("|")})\\b`, "i")
  const found = query.match(blocked)
  if (found) {
    throw new Error(`SQL rejeitado: palavra não permitida (${found[1]}).`)
  }

  // Regra 5: só a nossa tabela. Procura o nome que vem depois de FROM/JOIN e
  // rejeita qualquer outro (por exemplo "users" ou "sqlite_master").
  for (const [, table] of query.matchAll(/\b(?:from|join)\s+([\w.]+)/gi)) {
    if (table.toLowerCase() !== tableName.toLowerCase()) {
      throw new Error(`SQL rejeitado: tabela não permitida (${table}).`)
    }
  }

  // Garante um limite de linhas para não devolver a tabela inteira.
  return /\blimit\b/i.test(query) ? query : `${query} LIMIT ${queryLimit}`
}
