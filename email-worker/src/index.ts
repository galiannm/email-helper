export type Env = {
  API_URL: string
  INTERNAL_API_KEY: string
  INBOUND_EMAIL: string
}

export default {
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    // Read raw email bytes
    const rawEmail = await new Response(message.raw).text()

    const payload = {
      from: message.from,
      to: message.to,
      subject: message.headers.get('subject') ?? '',
      rawEmail,
    }

    await fetch(`${env.API_URL}/api/internal/ingest-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-API-Key': env.INTERNAL_API_KEY,
      },
      body: JSON.stringify(payload),
    })
  },
}
