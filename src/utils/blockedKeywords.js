// =============================================================================
// blockedKeywords.js — comandos SQL que NUNCA queremos executar
//
// Esta lista é usada em dois sítios:
//   ai.js          -> dizemos à IA para não usar estas palavras (um pedido);
//   validateSql.js -> rejeitamos a query se as contiver (a barreira real).
// =============================================================================

// São comandos que escrevem, apagam, alteram a estrutura ou mexem na
// configuração da base de dados. Queremos um agente só de LEITURA.
export const blockedKeywords = [
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
