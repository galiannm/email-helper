import { Hono } from "hono";
import { Env, Variables } from "../types";
import { authMiddleware, rootOnlyMiddleware } from "../middleware/auth";
import { v4 as uuidv4 } from "uuid";

const config = new Hono<{ Bindings: Env; Variables: Variables }>();

config.use("*", authMiddleware);

// ── Directors ─────────────────────────────────────────────────────────────────

config.get("/directors", async (c) => {
  const directors = await c.get("prisma").director.findMany({
    orderBy: [{ location: "asc" }, { section: "asc" }],
  });
  return c.json(directors);
});

config.post("/directors", rootOnlyMiddleware, async (c) => {
  const body = await c.req.json<{
    name: string;
    email: string;
    schoolName: string;
    location: string;
    section: string;
    signatureEn?: string;
    signatureFr?: string;
  }>();

  if (!body.name || !body.email || !body.schoolName || !body.location || !body.section) {
    return c.json({ error: "name, email, schoolName, location and section are required" }, 400);
  }

  const director = await c.get("prisma").director.create({
    data: {
      id:          uuidv4(),
      name:        body.name,
      email:       body.email,
      schoolName:  body.schoolName,
      location:    body.location,
      section:     body.section,
      signatureEn: body.signatureEn ?? null,
      signatureFr: body.signatureFr ?? null,
    },
  });

  return c.json(director, 201);
});

config.put("/directors/:id", rootOnlyMiddleware, async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{
    name?: string;
    email?: string;
    schoolName?: string;
    location?: string;
    section?: string;
    signatureEn?: string;
    signatureFr?: string;
  }>();

  const director = await c.get("prisma").director.update({
    where: { id },
    data: {
      ...(body.name        !== undefined && { name:        body.name }),
      ...(body.email       !== undefined && { email:       body.email }),
      ...(body.schoolName  !== undefined && { schoolName:  body.schoolName }),
      ...(body.location    !== undefined && { location:    body.location }),
      ...(body.section     !== undefined && { section:     body.section }),
      ...(body.signatureEn !== undefined && { signatureEn: body.signatureEn }),
      ...(body.signatureFr !== undefined && { signatureFr: body.signatureFr }),
    },
  });

  return c.json(director);
});

config.delete("/directors/:id", rootOnlyMiddleware, async (c) => {
  const { id } = c.req.param();
  const prisma = c.get("prisma");
  const director = await prisma.director.findUnique({ where: { id } });
  if (!director) return c.json({ error: "Not found" }, 404);
  await prisma.director.delete({ where: { id } });
  return c.json({ success: true });
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

config.post("/templates", rootOnlyMiddleware, async (c) => {
  const body = await c.req.json<{
    campus: string;
    part: string;
    textEn: string;
    textFr: string;
  }>();

  if (!body.campus || !body.part || !body.textEn || !body.textFr) {
    return c.json({ error: "campus, part, textEn and textFr are required" }, 400);
  }

  const template = await c.get("prisma").template.create({
    data: { id: uuidv4(), campus: body.campus, part: body.part, textEn: body.textEn, textFr: body.textFr },
  });

  return c.json(template, 201);
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

config.delete("/templates/:id", rootOnlyMiddleware, async (c) => {
  const { id } = c.req.param();
  const tmpl = await c.get("prisma").template.findUnique({ where: { id } });
  if (!tmpl) return c.json({ error: "Not found" }, 404);
  await c.get("prisma").template.delete({ where: { id } });
  return c.json({ success: true });
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
  const file   = formData.get("file")   as File | null;
  const name   = formData.get("name")   as string | null;
  const campus = formData.get("campus") as string | null;

  if (!file || !name) return c.json({ error: "file and name are required" }, 400);

  const docId   = uuidv4();
  const fileKey = `documents/${docId}/${file.name}`;
  await c.env.BUCKET.put(fileKey, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  const doc = await c.get("prisma").document.create({
    data: { id: docId, name, campus: campus || null, fileKey, fileName: file.name, contentType: file.type, uploadedBy: user.email },
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
