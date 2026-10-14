// =============================================================================
// ingest.js — ETAPA 2: ler o access.log (com STREAM) e guardar no SQLite
//
// Fluxo:
//   access.log --createReadStream--> readline --(1 linha de cada vez)-->
//   JSON.parse --> INSERT na tabela accessLogs (access_logs.db)
//
// CONCEITO PRINCIPAL — stream de LEITURA:
//   Com fs.readFile, um ficheiro de 2 GB seria carregado inteiro na memória.
//   Com createReadStream, o Node lê o ficheiro aos pedaços (chunks de ~64 KB)
//   e o readline junta os pedaços e entrega UMA LINHA de cada vez.
//   Resultado: a memória fica baixa, qualquer que seja o tamanho do ficheiro.
//
// Como correr:  npm run ingest   (precisa do access.log criado pelo npm run seed)
// Depois:       npm start        (index.js faz perguntas sobre estes dados)
// =============================================================================

// createReadStream: abre uma stream de leitura (o ficheiro é lido aos poucos).
import { createReadStream } from "node:fs"
// readline: transforma a stream de bytes numa sequência de LINHAS.
import { createInterface } from "node:readline"
// createdb: abre a base de dados e cria a tabela se preciso (ver db.js).
import { createdb } from "./db.js"
import { dbFile, logFile, logInterval } from "./utils/constantes.js"

// Abre a base de dados (cria o ficheiro access_logs.db na primeira vez).
const db = createdb(dbFile)
// Stream de leitura do access.log. Ainda não lê nada: só começa a fornecer
// dados quando alguém os pedir (o ciclo "for await" abaixo).
const fileStream = createReadStream(logFile)

// O readline "embrulha" a stream. crlfDelay: Infinity faz com que \r\n
// (fim de linha do Windows) conte como UMA quebra de linha só.
const rl = createInterface({
  input: fileStream,
  crlfDelay: Infinity,
})

console.log(
  `Lendo logs de acesso do arquivo ${logFile} e inserindo no banco de dados...`,
)

// Contador de registos inseridos (para mostrar o progresso e o total).
let count = 0

// CICLO PRINCIPAL: o readline é "async iterable", por isso podemos percorrê-lo
// com for await. Cada volta recebe UMA linha; se o disco ainda não entregou a
// seguinte, o ciclo espera. A BACKPRESSURE é automática: só pedimos a próxima
// linha quando acabamos de tratar a atual, por isso a leitura nunca corre
// mais depressa do que a base de dados consegue gravar.
for await (const line of rl) {
  if (!line.trim()) continue // Ignora linhas vazias

  // Cada linha é texto JSON; JSON.parse transforma-o num objeto JavaScript.
  // Se a linha estiver partida (ex.: a última linha incompleta), ignoramos.
  let record

  try {
    record = JSON.parse(line)
  } catch (_) {
    continue
  }

  // INSERT: grava uma linha na tabela. Os "?" são marcadores preenchidos pelos
  // valores do .run(...), pela mesma ordem. Isto evita erros de aspas e
  // ataques de SQL injection.
  //
  // Nota de estudo: aqui o prepare() corre a CADA linha e cada INSERT é uma
  // transação própria. Funciona, mas é lento com milhões de linhas. Melhoria
  // possível: preparar a query UMA vez fora do ciclo e agrupar os inserts em
  // transações (BEGIN/COMMIT) de 1.000 a 10.000 linhas.
  // Atenção: correr o ingest duas vezes insere os registos em duplicado.
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

  // A cada logInterval registos, mostra o progresso.
  if (count % logInterval === 0) {
    console.log(`Registros inseridos: ${count.toLocaleString()}`)
  }
}

// Fim do ficheiro: mostra o total e fecha a base de dados.
console.log(`Total de registros inseridos: ${count.toLocaleString()}`)
db.close()
