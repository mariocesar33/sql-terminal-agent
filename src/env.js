import { z } from "zod"

// Carrega o ficheiro .env (Node 20.12+). Se não existir, usa as variáveis
// que já estiverem no ambiente do sistema.
try {
  process.loadEnvFile()
} catch {
  // sem .env: segue com process.env
}

const envSchema = z.object({
  OPENAI_API_KEY: z
    .string()
    .min(1, "OPENAI_API_KEY é obrigatória. Define-a no ficheiro .env"),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error("Variáveis de ambiente inválidas:")
  for (const issue of result.error.issues) {
    console.error(`- ${issue.path.join(".")}: ${issue.message}`)
  }
  process.exit(1)
}

export const env = result.data
