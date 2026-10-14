// =============================================================================
// db.js — a BASE DE DADOS (SQLite)
//
// Responsabilidade única: abrir a base de dados e garantir que a tabela existe.
//
// Usamos o SQLite que já vem no Node ("node:sqlite"), sem instalar nada.
// É uma base de dados guardada num único ficheiro (access_logs.db).
//
// Quem usa:
//   ingest.js -> abre a base e INSERE os registos lidos do access.log
//   index.js  -> abre a base e CONSULTA-a com as queries geradas pela IA
// =============================================================================

// DatabaseSync: classe do SQLite nativo do Node (API síncrona: cada comando
// espera pelo resultado, o que torna o código mais simples).
import { DatabaseSync } from "node:sqlite"
import { tableName } from "./utils/constantes.js"

// Abre (ou cria) a base de dados e devolve a ligação.
// path = nome do ficheiro. O valor por omissão ":memory:" cria uma base
// temporária só em RAM, que desaparece quando o programa termina.
export function createdb(path = ":memory:") {
  const db = new DatabaseSync(path)

  // exec() executa SQL que não devolve linhas (aqui, criar a tabela).
  // IF NOT EXISTS: se a tabela já existir não faz nada, por isso podemos
  // chamar createdb() várias vezes sem problema.
  //
  // Colunas (têm de bater certo com os campos de cada linha do access.log):
  //   logId     -> chave primária, número automático (1, 2, 3...) de cada linha
  //   ip ... jobTitle -> dados do utilizador (vêm do generateUser, no seed.js)
  //   id        -> UUID do acesso
  //   timestamp -> data/hora do acesso, em texto ISO 8601
  db.exec(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      logId INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT NOT NULL,
      username TEXT NOT NULL,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT NOT NULL,
      location TEXT NOT NULL,
      jobArea TEXT NOT NULL,
      company TEXT NOT NULL,
      jobTitle TEXT NOT NULL,
      id TEXT NOT NULL,
      timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  return db
}
