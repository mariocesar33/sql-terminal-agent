// =============================================================================
// schemaDescription.js — descrição da tabela, escrita para a IA ler
//
// A IA não vê a base de dados: só sabe o que lhe escrevermos aqui. Por isso
// este texto é inserido no prompt (ver ai.js). Se mudares as colunas no db.js,
// atualiza também esta descrição, senão a IA vai gerar queries erradas.
// =============================================================================

// tableName: nome da tabela (ver constantes.js).
import { tableName } from "./constantes.js"

// Texto simples, uma linha por coluna, com o tipo e o significado de cada uma.
// A dica sobre datetime(timestamp) existe porque o timestamp é guardado como
// texto ISO (com "T" e "Z") e o SQLite precisa de o normalizar para comparar.
export const schemaDescription = `
  Tabela ${tableName} (um registo por acesso):
  - logId INTEGER: identificador único da linha
  - ip TEXT NOT NULL: endereço IP do utilizador
  - username TEXT NOT NULL: nome de utilizador (o mesmo utilizador aparece em vários acessos)
  - firstName TEXT NOT NULL: primeiro nome
  - lastName TEXT NOT NULL: apelido
  - email TEXT NOT NULL: email
  - location TEXT NOT NULL: cidade
  - jobArea TEXT NOT NULL: área profissional
  - company TEXT NOT NULL: empresa
  - jobTitle TEXT NOT NULL: cargo
  - id TEXT NOT NULL: identificador único do acesso (UUID)
  - timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP: data e hora do acesso, texto ISO 8601 em UTC
    (ex.: 2026-10-12T08:00:00.000Z). Usa date() ou datetime() do SQLite
    para filtrar por datas e compara sempre com datetime(timestamp), por
    exemplo: datetime(timestamp) >= datetime('now', '-7 days').
`
