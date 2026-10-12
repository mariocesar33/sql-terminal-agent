import { DatabaseSync } from "node:sqlite"

export function createdb(path = ":memory:") {
  const db = new DatabaseSync(path)

  db.exec(`
    CREATE TABLE IF NOT EXISTS accessLogs (
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
