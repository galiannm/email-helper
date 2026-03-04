import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

export type Env = {
  DB: D1Database
  BUCKET: R2Bucket
  GEMINI_API_KEY: string
  RESEND_API_KEY: string
  INTERNAL_API_KEY: string
  BETTER_AUTH_SECRET: string
  FRONTEND_URL: string
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const env = c.env as Env
      const allowed = [env.FRONTEND_URL, 'http://localhost:5173']
      return allowed.includes(origin) ? origin : allowed[0]
    },
    credentials: true,
  })
)

app.get('/health', (c) => c.json({ status: 'ok' }))

export default app
