/** Thrown when an integration is called without the required credentials. */
export class IntegrationNotConfiguredError extends Error {
  constructor(provider: string, missing: string[]) {
    super(
      `Integração "${provider}" não configurada. Defina: ${missing.join(', ')}. ` +
        'Consulte .env.example. (CLAUDE.md item 11: não simular integrações.)',
    )
    this.name = 'IntegrationNotConfiguredError'
  }
}

/** Generic error from an external provider, carrying the original status. */
export class IntegrationRequestError extends Error {
  constructor(
    public readonly provider: string,
    public readonly status: number,
    message: string,
    public readonly raw?: unknown,
  ) {
    super(`[${provider}] ${status}: ${message}`)
    this.name = 'IntegrationRequestError'
  }
}
