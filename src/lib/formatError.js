// =============================================================================
// formatError.js — mensagens de erro curtas e legíveis
//
// Os erros da IA e da base de dados são enormes e técnicos (centenas de linhas).
// Aqui transformamos os mais comuns numa frase que o utilizador entende e sabe
// o que fazer a seguir.
//
// Usado por: index.js, no bloco catch do ciclo de perguntas.
// =============================================================================

// Transforma erros técnicos em mensagens curtas para o terminal.
export function formatError(error) {
  // Texto do erro (ou o próprio valor, se não for um Error).
  const message = error?.message ?? String(error)

  // Erro do validateSql.js: a IA gerou SQL não permitido.
  if (message.startsWith("SQL rejeitado")) {
    return `${message} Tenta reformular a pergunta.`
  }

  // Erro do SQLite ao executar a query (ex.: coluna que não existe).
  if (typeof error?.code === "string" && error.code.startsWith("ERR_SQLITE")) {
    return `Erro ao executar a query: ${message}`
  }

  // O AI SDK embrulha o erro real em lastError depois das tentativas.
  const cause = error?.lastError ?? error
  // statusCode é o código HTTP devolvido pela API da IA. Os mais comuns:
  //   401/403 -> chave inválida   404 -> modelo não existe
  //   429     -> demasiados pedidos ou sem créditos
  //   5xx     -> o provedor está sobrecarregado ou em baixo
  const status = cause?.statusCode
  const causeMessage = cause?.message ?? message

  if (status === 429 && /quota|credit/i.test(causeMessage)) {
    return "Sem créditos ou quota no provedor de IA. Adiciona saldo ou escolhe outro provedor."
  }

  if (status === 429) {
    return "Demasiados pedidos ao provedor de IA. Espera um pouco e tenta outra vez."
  }

  if (status === 401 || status === 403) {
    return "Chave de API inválida ou sem permissão. Confirma a chave no ficheiro .env."
  }

  if (status === 404) {
    return "Modelo não encontrado. Confirma OPENAI_MODEL / GEMINI_MODEL no ficheiro .env."
  }

  if (status >= 500) {
    return "O modelo está sobrecarregado ou indisponível. Tenta mais tarde ou troca de modelo (OPENAI_MODEL / GEMINI_MODEL no .env)."
  }

  // Falhas de rede (sem internet, DNS, ligação recusada).
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT/i.test(message)) {
    return "Sem ligação ao provedor de IA. Verifica a tua ligação à internet."
  }

  // Qualquer outro erro: mostra a mensagem original.
  return message
}
