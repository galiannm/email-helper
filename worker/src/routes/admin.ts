import { Hono } from "hono";
import { Env, Variables } from "../types";
import { authMiddleware, rootOnlyMiddleware } from "../middleware/auth";
import { v4 as uuidv4 } from "uuid";

const admin = new Hono<{ Bindings: Env; Variables: Variables }>();

admin.use("*", authMiddleware);
admin.use("*", rootOnlyMiddleware);

admin.get("/allowed-emails", async (c) => {
  try {
    const rows = await c.env.DB.prepare(
      'SELECT id, email, role, addedBy, createdAt FROM "AllowedEmail" ORDER BY createdAt DESC'
    ).all();
    return c.json({ allowedEmails: rows.results });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("GET /allowed-emails error:", msg);
    return c.json({ error: msg }, 500);
  }
});

admin.post("/allowed-emails", async (c) => {
  const { email, role } = await c.req.json<{ email: string; role?: string }>();

  if (!email || typeof email !== "string") {
    return c.json({ error: "email is required" }, 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const assignedRole = role === "root" ? "root" : "normal";
  const user = c.get("user")!;

  try {
    await c.env.DB.prepare(
      'INSERT INTO "AllowedEmail" (id, email, role, addedBy, createdAt) VALUES (?, ?, ?, ?, ?)'
    )
      .bind(uuidv4(), normalizedEmail, assignedRole, user.email, new Date().toISOString())
      .run();
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("UNIQUE")) {
      return c.json({ error: "Email already in the allowlist" }, 409);
    }
    throw e;
  }

  return c.json({ success: true }, 201);
});

admin.delete("/allowed-emails/:id", async (c) => {
  const { id } = c.req.param();
  const result = await c.env.DB.prepare(
    'DELETE FROM "AllowedEmail" WHERE id = ?'
  )
    .bind(id)
    .run();

  if (result.meta.changes === 0) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json({ success: true });
});

export default admin;
