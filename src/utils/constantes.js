// =============================================================================
// constantes.js — valores partilhados por vários ficheiros
//
// Ter os valores num só sítio evita repeti-los (e errar) em cada ficheiro:
// se mudares, por exemplo, o nome da base de dados, só alteras aqui.
//
// Quem importa este ficheiro:
//   seed.js, ingest.js    -> logFile, logInterval, (ingest) dbFile
//   index.js              -> dbFile, tableName
//   validateSql.js        -> tableName, queryLimit
//   schemaDescription.js  -> tableName
//   ai.js                 -> tableName, maxRowsForAnswer
// =============================================================================

// Ficheiro de texto com os logs: o seed.js ESCREVE-o e o ingest.js LÊ-o.
export const logFile = "access.log"
// De quantos em quantos registos o seed/ingest mostram o progresso
// (é uma contagem de registos, não segundos).
export const logInterval = 1000
// Nome da tabela no SQLite. É também o ÚNICO nome que a IA pode usar.
export const tableName = "accessLogs"
// Limite de linhas por query gerada pela IA (aplicado em validateSql.js).
export const queryLimit = 100
// Ficheiro da base de dados SQLite: o ingest.js cria-o e enche-o,
// o index.js consulta-o.
export const dbFile = "access_logs.db"
// Máximo de linhas do resultado enviadas à IA para escrever a resposta final.
// Limitar poupa tokens (dinheiro) e evita pedidos gigantes.
export const maxRowsForAnswer = 50
