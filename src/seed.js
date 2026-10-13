// =============================================================================
// seed.js — ETAPA 1: gerar o ficheiro de logs (access.log)
//
// Objetivo: criar um ficheiro de texto GRANDE (milhões de linhas, até GBs) com
// acessos falsos, para depois treinarmos a leitura com streams.
//
// Cada linha do access.log é um objeto JSON (formato "JSON Lines"):
//   {"ip":"...","username":"...","firstName":"...", ...,"id":"...","timestamp":"..."}
//
// Como correr:  npm run seed -- 500000   (nº de registos; sem argumento, 100)
//
// CONCEITO PRINCIPAL — stream de ESCRITA:
//   Em vez de montar o ficheiro inteiro na memória e gravá-lo de uma vez,
//   enviamos uma linha de cada vez a uma stream, e o Node vai gravando no disco
//   aos poucos. A memória fica baixa mesmo com ficheiros de vários GB.
//
// Próximo passo do projeto: ingest.js lê este ficheiro e guarda no SQLite.
// =============================================================================

// createWriteStream: abre uma stream de escrita num ficheiro.
// statSync: lê o tamanho atual do ficheiro (para mostrar o progresso em GB).
import { createWriteStream, statSync } from "node:fs"
// faker: biblioteca que inventa dados realistas (nomes, emails, IPs...).
import { faker } from "@faker-js/faker"
// Nome do ficheiro de logs e intervalo de progresso (ver constantes.js).
import { logFile, logInterval } from "./utils/constantes.js"

// Quantos registos gerar. Vem do terminal (process.argv[2]); sem argumento, 100.
// Ex.: "npm run seed -- 5000000" -> process.argv[2] é "5000000".
const maxRecords = Number(process.argv[2]) || 100

// Validação: tem de ser um número inteiro maior que zero. Se não for,
// mostramos como usar e terminamos (exit(1) = terminou com erro).
if (
  (!Number.isInteger(maxRecords) && Number.isFinite(maxRecords)) ||
  Number.isNaN(maxRecords) ||
  maxRecords <= 0
) {
  console.error("Uso: npm run seed <número_de_registros>")
  console.error("Por favor, forneça um número válido de registros para gerar.")
  process.exit(1)
}

// Abre a stream de escrita. Daqui em diante, cada stream.write(...) envia
// texto para o access.log. Se o ficheiro já existir, é recriado vazio.
const stream = createWriteStream(logFile)

// Cria UM utilizador falso (só os dados da pessoa).
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

// Cria UM registo de acesso: copia os dados do utilizador (...user) e
// acrescenta um id único do acesso (UUID) e a data/hora (nas últimas 24h).
function generateLogEntry(user) {
  return {
    ...user,
    id: faker.string.uuid(),
    timestamp: faker.date.recent().toISOString(),
  }
}

// BACKPRESSURE (contrapressão) — o conceito mais importante deste ficheiro.
//
// stream.write(linha) devolve:
//   true  -> o buffer interno tem espaço, podes continuar a escrever;
//   false -> o buffer encheu (estamos a escrever mais depressa do que o disco
//            aguenta). Convém PARAR e esperar pelo evento "drain", que avisa
//            quando o buffer esvaziou.
// Se ignorarmos isto, os dados acumulam-se na memória e o programa pode
// rebentar com ficheiros enormes.
//
// Esta função devolve uma Promise: resolve logo, ou só depois do "drain".
// Assim, o ciclo principal faz "await writeRecord(...)" e abranda sozinho.
function writeRecord(line) {
  return new Promise((resolve) => {
    if (!stream.write(line)) {
      stream.once("drain", resolve)
    } else {
      resolve()
    }
  })
}

// Converte bytes em GB (1 GB = 1024 x 1024 x 1024 bytes), com 4 casas
// decimais. Serve só para mostrar o tamanho no ecrã.
function convertFromBytesToGB(bytes) {
  return (bytes / 1024 / 1024 / 1024).toFixed(4)
}

console.log(
  `Gerando logs de acesso falsos em ${logFile}...(Ctrl+C para interromper)`,
)
console.log(`Número máximo de registros: ${maxRecords.toLocaleString()}`)

// Criamos só 5 utilizadores falsos. Cada acesso escolhe um destes 5 ao acaso,
// por isso o mesmo utilizador aparece em muitos acessos (útil para perguntar
// "quantos acessos teve o utilizador X?").
const users = Array.from({ length: 5 }, generateUser)

// Fica true quando o utilizador carrega em Ctrl+C. O ciclo principal vê
// esta marca e termina sozinho.
let interrupted = false

// SIGINT = sinal enviado pelo Ctrl+C. Só marcamos o pedido; não fechamos a
// stream aqui, porque o ciclo pode estar parado num "await" à espera do
// "drain" e ficaria pendente para sempre (o Node avisaria "unsettled
// top-level await").
process.on("SIGINT", () => {
  interrupted = true
})

// CICLO PRINCIPAL: repete até gerar maxRecords registos (ou Ctrl+C).
let count = 0
while (count < maxRecords && !interrupted) {
  // 1) escolhe um dos 5 utilizadores ao acaso
  const user = faker.helpers.arrayElement(users)
  // 2) monta o registo do acesso
  const record = generateLogEntry(user)

  // 3) grava uma linha: JSON.stringify transforma o objeto em texto e o "\n"
  //    separa os registos. O "await" respeita a backpressure (ver acima).
  await writeRecord(`${JSON.stringify(record)}\n`)
  count++

  // 4) a cada logInterval registos, mostra o progresso (lendo o tamanho atual
  //    do ficheiro).
  if (count % logInterval === 0) {
    const { size } = statSync(logFile)
    console.log(
      `Registros: ${count.toLocaleString()}, Tamanho do arquivo: ${convertFromBytesToGB(size)} GB`,
    )
  }
}

// FIM (concluído ou interrompido): stream.end() grava o que falta e fecha o
// ficheiro. O callback só corre quando tudo já foi para o disco.
stream.end(() => {
  const { size } = statSync(logFile)
  console.log(
    `${interrupted ? "Geração interrompida" : "Geração concluída"}. registros: ${count.toLocaleString()}, Tamanho final: ${convertFromBytesToGB(size)} GB`,
  )
})
