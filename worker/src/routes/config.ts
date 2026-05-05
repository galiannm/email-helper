import { Hono } from "hono";
import { Env, Variables } from "../types";
import { authMiddleware, rootOnlyMiddleware } from "../middleware/auth";
import { v4 as uuidv4 } from "uuid";

const config = new Hono<{ Bindings: Env; Variables: Variables }>();

config.use("*", authMiddleware);

// ── Directors ─────────────────────────────────────────────────────────────────

config.get("/directors", async (c) => {
  const directors = await c.get("prisma").director.findMany({ orderBy: { id: "asc" } });
  return c.json(directors);
});

config.put("/directors/:id", rootOnlyMiddleware, async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{
    name?: string;
    email?: string;
    schoolName?: string;
    signatureEn?: string;
    signatureFr?: string;
  }>();

  const director = await c.get("prisma").director.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.schoolName !== undefined && { schoolName: body.schoolName }),
      ...(body.signatureEn !== undefined && { signatureEn: body.signatureEn }),
      ...(body.signatureFr !== undefined && { signatureFr: body.signatureFr }),
    },
  });

  return c.json(director);
});

// ── Sections ──────────────────────────────────────────────────────────────────

config.get("/sections", async (c) => {
  const sections = await c.get("prisma").section.findMany({ orderBy: { code: "asc" } });
  return c.json(sections);
});

// ── Templates ─────────────────────────────────────────────────────────────────

config.get("/templates", async (c) => {
  const { campus } = c.req.query();
  const templates = await c.get("prisma").template.findMany({
    where: campus ? { campus } : undefined,
    orderBy: [{ campus: "asc" }, { part: "asc" }],
  });
  return c.json(templates);
});

config.put("/templates/:id", rootOnlyMiddleware, async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{ textEn?: string; textFr?: string }>();

  const template = await c.get("prisma").template.update({
    where: { id },
    data: {
      ...(body.textEn !== undefined && { textEn: body.textEn }),
      ...(body.textFr !== undefined && { textFr: body.textFr }),
    },
  });

  return c.json(template);
});

// ── Documents ─────────────────────────────────────────────────────────────────

config.get("/documents", async (c) => {
  const { campus } = c.req.query();
  const docs = await c.get("prisma").document.findMany({
    where: campus ? { OR: [{ campus: null }, { campus }] } : undefined,
    orderBy: { uploadedAt: "desc" },
  });
  return c.json(docs);
});

config.post("/documents", rootOnlyMiddleware, async (c) => {
  const user = c.get("user")!;
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  const name = formData.get("name") as string | null;
  const campus = formData.get("campus") as string | null;

  if (!file || !name) {
    return c.json({ error: "file and name are required" }, 400);
  }

  const docId = uuidv4();
  const fileKey = `documents/${docId}/${file.name}`;
  const arrayBuffer = await file.arrayBuffer();

  await c.env.BUCKET.put(fileKey, arrayBuffer, {
    httpMetadata: { contentType: file.type },
  });

  const doc = await c.get("prisma").document.create({
    data: {
      id: docId,
      name,
      campus: campus || null,
      fileKey,
      fileName: file.name,
      contentType: file.type,
      uploadedBy: user.email,
    },
  });

  return c.json(doc, 201);
});

config.delete("/documents/:id", rootOnlyMiddleware, async (c) => {
  const { id } = c.req.param();
  const prisma = c.get("prisma");

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return c.json({ error: "Not found" }, 404);

  await c.env.BUCKET.delete(doc.fileKey);
  await prisma.document.delete({ where: { id } });

  return c.json({ success: true });
});

// Download document (for preview in UI)
config.get("/documents/:id/download", async (c) => {
  const { id } = c.req.param();
  const doc = await c.get("prisma").document.findUnique({ where: { id } });
  if (!doc) return c.json({ error: "Not found" }, 404);

  const obj = await c.env.BUCKET.get(doc.fileKey);
  if (!obj) return c.json({ error: "File not found in storage" }, 404);

  return new Response(obj.body, {
    headers: {
      "Content-Type": doc.contentType,
      "Content-Disposition": `inline; filename="${doc.fileName}"`,
    },
  });
});

export default config;
