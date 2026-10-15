import { equal } from "node:assert"
import { describe, it } from "node:test"
import { createdb } from "./db.js"

describe("Teste para camada de banco de dados", () => {
  const db = createdb()

  it("Deve inserir um registro no banco de dados", () => {
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
  })
})
