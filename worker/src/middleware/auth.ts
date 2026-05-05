import { Context, Next } from "hono";
import { Env, Variables } from "../types";
import { isRootUser } from "../lib/auth";

export async function authMiddleware(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
) {
  const auth = c.get("auth");
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", { id: session.user.id, email: session.user.email });
  await next();
}

export async function rootOnlyMiddleware(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
) {
  const user = c.get("user");
  if (!user || !isRootUser(user.email, c.env)) {
    return c.json({ error: "Forbidden" }, 403);
  }
  await next();
}

export async function optionalAuthMiddleware(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
) {
  const auth = c.get("auth");
  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (session?.user) {
      c.set("user", { id: session.user.id, email: session.user.email });
    }
  } catch {}
  await next();
}
