// Cria UM utilizador falso (só os dados da pessoa).
export function generateUser() {
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
export function generateLogEntry(user) {
  return {
    ...user,
    id: faker.string.uuid(),
    timestamp: faker.date.recent().toISOString(),
  }
}
