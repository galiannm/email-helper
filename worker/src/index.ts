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

app.route("/api/internal", internalRoutes);
app.route("/api/emails", emailRoutes);
app.route("/api/config", configRoutes);
app.route("/api/admin", adminRoutes);

export default app;
