import { createReadStream } from "node:fs"
import { createInterface } from "node:readline"
import { createdb } from "./db.js"
import { logFile, logInterval } from "./utils/constantes.js"

const db = createdb("access_logs.db")
const fileStream = createReadStream(logFile)

const rl = createInterface({
  input: fileStream,
  crlfDelay: Infinity,
})

console.log(
  `Lendo logs de acesso do arquivo ${logFile} e inserindo no banco de dados...`,
)

let count = 0

for await (const line of rl) {
  if (!line.trim()) continue // Ignora linhas vazias

  let record

  try {
    record = JSON.parse(line)
  } catch (_) {
    continue
  }

  db.prepare(`
    INSERT INTO accessLogs (
        ip,
        username,
        firstName,
        lastName,
        email,
        location,
        jobArea,
        company,
        jobTitle,
        id,
        timestamp
    ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `).run(
    record.ip,
    record.username,
    record.firstName,
    record.lastName,
    record.email,
    record.location,
    record.jobArea,
    record.company,
    record.jobTitle,
    record.id,
    record.timestamp,
  )
  count++

  if (count % logInterval === 0) {
    console.log(`Registros inseridos: ${count.toLocaleString()}`)
  }
}

console.log(`Total de registros inseridos: ${count.toLocaleString()}`)
db.close()
