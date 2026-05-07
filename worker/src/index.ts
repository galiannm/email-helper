import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createAuth, isEmailAllowed } from "./lib/auth";
import { createPrismaClient } from "./lib/db";
import { Env, Variables } from "./types";
import adminRoutes from "./routes/admin";
import internalRoutes from "./routes/internal";
import emailRoutes from "./routes/emails";
import configRoutes from "./routes/config";
import { pollGraphInbox, getPollStatus } from "./services/graph-poller";
import { authMiddleware } from "./middleware/auth";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use("*", logger());

app.use(
  "*",
  cors({
    origin: (origin, c) => {
      if (origin?.startsWith("http://localhost:")) return origin;
      const frontendUrl = c.env.FRONTEND_URL;
      if (frontendUrl && origin === frontendUrl) return origin;
      if (origin?.endsWith(".pages.dev")) return origin;
      return "http://localhost:5173";
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("*", async (c, next) => {
  c.set("prisma", createPrismaClient(c.env.DB));
  c.set("auth", createAuth(c.env));
  await next();
});

// Guard magic link against the allowlist before better-auth processes it
app.use("/api/auth/sign-in/magic-link", async (c, next) => {
  if (c.req.method === "POST") {
    const body = await c.req.raw
      .clone()
      .json<{ email?: string }>()
      .catch(() => null);
    const email = typeof body?.email === "string" ? body.email : null;
    if (email && !(await isEmailAllowed(email, c.env))) {
      return c.json(
        { message: "This email is not authorised to access this platform." },
        403
      );
    }
  }
  await next();
});

app.on(["POST", "GET", "OPTIONS"], "/api/auth/*", (c) => {
  const auth = c.get("auth");
  return auth.handler(c.req.raw);
});

app.get("/health", (c) => c.json({ status: "ok" }));

// Manual poll trigger — internal key auth
app.post("/api/internal/poll", async (c) => {
  const apiKey = c.req.header("X-Internal-API-Key");
  if (c.env.INTERNAL_API_KEY && apiKey !== c.env.INTERNAL_API_KEY) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.executionCtx.waitUntil(pollGraphInbox(c.env));
  return c.json({ success: true, message: "Poll triggered" });
});

// Poll status — requires login (useful for the UI)
app.get("/api/poll/status", authMiddleware, async (c) => {
  const status = await getPollStatus(c.env.DB);
  return c.json(status ?? { status: "never_run", processed: 0, updatedAt: null });
});

app.route("/api/internal", internalRoutes);
app.route("/api/emails", emailRoutes);
app.route("/api/config", configRoutes);
app.route("/api/admin", adminRoutes);

// ── Cloudflare Workers scheduled handler (cron) ───────────────────────────────
const scheduled: ExportedHandlerScheduledHandler<Env> = async (_event, env, ctx) => {
  ctx.waitUntil(pollGraphInbox(env));
};

export default { fetch: app.fetch, scheduled };
