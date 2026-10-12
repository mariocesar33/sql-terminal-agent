// precisamos de gerar um arquivo access.log fake
import { createWriteStream, statSync } from "node:fs"
import { faker } from "@faker-js/faker"
import { logFile, logInterval } from "./utils/constantes.js"

// Função para gerar uma entrada de log fake

const maxRecords = Number(process.argv[2]) || 100

if (
  (!Number.isInteger(maxRecords) && Number.isFinite(maxRecords)) ||
  Number.isNaN(maxRecords) ||
  maxRecords <= 0
) {
  console.error("Uso: npm run seed <número_de_registros>")
  console.error("Por favor, forneça um número válido de registros para gerar.")
  process.exit(1)
}

const stream = createWriteStream(logFile)

function generateUser() {
  return {
    ip: faker.internet.ip(),
    username: faker.internet.userName(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    location: faker.location.city(),
    jobArea: faker.person.jobArea(),
    company: faker.company.name(),
    jobTitle: faker.person.jobTitle(),
  }
}

function generateLogEntry(user) {
  return {
    ...user,
    id: faker.string.uuid(),
    timestamp: faker.date.recent().toISOString(),
  }
}

// Backpressure implementation
function writeRecord(line) {
  return new Promise((resolve) => {
    if (!stream.write(line)) {
      stream.once("drain", resolve)
    } else {
      resolve()
    }
  })
}

function convertFromBytesToGB(bytes) {
  return (bytes / 1024 / 1024 / 1024).toFixed(4)
}

console.log(
  `Gerando logs de acesso falsos em ${logFile}...(Ctrl+C para interromper)`,
)
console.log(`Número máximo de registros: ${maxRecords.toLocaleString()}`)

const users = Array.from({ length: 5 }, generateUser)

process.on("SIGINT", () => {
  stream.end(() => {
    const { size } = statSync(logFile)
    console.log(
      `Geração interrompida. registros: ${count.toLocaleString()}, Tamanho final: ${convertFromBytesToGB(size)} GB`,
    )
  })
})

let count = 0
while (count < maxRecords) {
  const user = faker.helpers.arrayElement(users)
  const record = generateLogEntry(user)

  await writeRecord(`${JSON.stringify(record)}\n`)
  count++

  if (count % logInterval === 0) {
    const { size } = statSync(logFile)
    console.log(
      `Registros: ${count.toLocaleString()}, Tamanho do arquivo: ${convertFromBytesToGB(size)} GB`,
    )
  }
}

stream.end(() => {
  const { size } = statSync(logFile)
  console.log(
    `Geração concluída. registros: ${count.toLocaleString()}, Tamanho final: ${convertFromBytesToGB(size)} GB`,
  )
})
