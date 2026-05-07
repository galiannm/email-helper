import { Hono } from "hono";
import { Resend } from "resend";
import { Env, Variables } from "../types";
import { authMiddleware } from "../middleware/auth";
import { runPipeline } from "../services/pipeline";

const emails = new Hono<{ Bindings: Env; Variables: Variables }>();

emails.use("*", authMiddleware);

// ── List ──────────────────────────────────────────────────────────────────────

emails.get("/", async (c) => {
  const prisma = c.get("prisma");
  const { status, campus, lang, limit = "30", offset = "0" } = c.req.query();

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.incomingEmail.findMany({
      where,
      orderBy: { receivedAt: "desc" },
      take: parseInt(limit),
      skip: parseInt(offset),
      include: {
        extractedInfo: true,
        draft: { include: { director: true } },
      },
    }),
    prisma.incomingEmail.count({ where }),
  ]);

  // Filter by campus / language after join (SQLite doesn't support JSON filtering)
  const filtered = items.filter((item) => {
    if (campus && item.extractedInfo?.detectedCampus !== campus) return false;
    if (lang && item.extractedInfo?.detectedLanguage !== lang) return false;
    return true;
  });

  return c.json({
    items: filtered,
    total,
    hasMore: parseInt(offset) + parseInt(limit) < total,
  });
});

// ── Detail ────────────────────────────────────────────────────────────────────

emails.get("/:id", async (c) => {
  const prisma = c.get("prisma");
  const { id } = c.req.param();

  const email = await prisma.incomingEmail.findUnique({
    where: { id },
    include: {
      extractedInfo: true,
      draft: { include: { director: true } },
    },
  });

  if (!email) return c.json({ error: "Not found" }, 404);
  return c.json(email);
});

// ── Update draft text ─────────────────────────────────────────────────────────

emails.put("/:id/draft", async (c) => {
  const prisma = c.get("prisma");
  const { id } = c.req.param();
  const { draftText } = await c.req.json<{ draftText: string }>();

  if (typeof draftText !== "string") {
    return c.json({ error: "draftText is required" }, 400);
  }

  const draft = await prisma.emailDraft.findUnique({ where: { emailId: id } });
  if (!draft) return c.json({ error: "Draft not found" }, 404);

  const updated = await prisma.emailDraft.update({
    where: { emailId: id },
    data: { draftText, editedAt: new Date() },
  });

  return c.json(updated);
});

// ── Send to director ──────────────────────────────────────────────────────────

emails.post("/:id/send", async (c) => {
  const prisma = c.get("prisma");
  const { id } = c.req.param();

  const email = await prisma.incomingEmail.findUnique({
    where: { id },
    include: {
      extractedInfo: true,
      draft: { include: { director: true } },
    },
  });

  if (!email) return c.json({ error: "Not found" }, 404);
  if (!email.draft) return c.json({ error: "No draft to send" }, 400);
  if (email.draft.sentAt) return c.json({ error: "Already sent" }, 409);

  const { draft, extractedInfo } = email;
  const director = draft.director;
  const campus = extractedInfo?.detectedCampus ?? null;

  // Fetch attachments for this campus + global docs
  const documents = await prisma.document.findMany({
    where: { OR: [{ campus: null }, { campus: campus ?? undefined }] },
  });

  // Build Resend attachments from R2
  type ResendAttachment = { filename: string; content: string; contentType: string };
  const attachments: ResendAttachment[] = [];
  for (const doc of documents) {
    const obj = await c.env.BUCKET.get(doc.fileKey);
    if (!obj) continue;
    const buffer = await obj.arrayBuffer();
    const uint8 = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < uint8.byteLength; i++) binary += String.fromCharCode(uint8[i]);
    const base64 = btoa(binary);
    attachments.push({ filename: doc.fileName, content: base64, contentType: doc.contentType });
  }

  const parentName  = extractedInfo?.parentName  ?? "the parent";
  // Use the extracted parent email (from the form field) as the real reply-to address.
  // email.fromAddress is no-reply@acacia-education.com — not useful for replies.
  const replyToAddr = extractedInfo?.parentEmail ?? email.fromAddress;
  const resend = new Resend(c.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: "Acacia Email Helper <noreply@admin.acacia-education.com>",
    to: director.email,
    reply_to: replyToAddr,
    subject: `[Action needed] New inquiry from ${parentName} — draft reply inside`,
    text: buildDirectorEmail(replyToAddr, email.subject, email.rawText, draft.draftText, parentName),
    attachments,
  });

  if (error) {
    console.error("Resend error:", error);
    return c.json({ error: "Failed to send email" }, 500);
  }

  await prisma.emailDraft.update({
    where: { emailId: id },
    data: { sentAt: new Date() },
  });

  await prisma.incomingEmail.update({
    where: { id },
    data: { status: "sent" },
  });

  return c.json({ success: true });
});

// ── Regenerate ────────────────────────────────────────────────────────────────

emails.post("/:id/regenerate", async (c) => {
  const prisma = c.get("prisma");
  const { id } = c.req.param();

  const email = await prisma.incomingEmail.findUnique({ where: { id } });
  if (!email) return c.json({ error: "Not found" }, 404);

  // Reset status so pipeline picks it up fresh
  await prisma.incomingEmail.update({
    where: { id },
    data: { status: "new", errorMessage: null },
  });

  c.executionCtx.waitUntil(runPipeline(id, c.env));

  return c.json({ success: true });
});

export default emails;

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildDirectorEmail(
  fromAddress: string,
  subject: string,
  rawText: string,
  draftText: string,
  parentName: string
): string {
  const separator = "─".repeat(60);
  return `You have a new parent inquiry that needs a reply.

FROM:    ${fromAddress}
SUBJECT: ${subject}

${separator}
ORIGINAL MESSAGE
${separator}
${rawText.slice(0, 2000)}${rawText.length > 2000 ? "\n[... truncated]" : ""}

${separator}
SUGGESTED DRAFT REPLY
(Review and send to ${fromAddress} — replace [DATE 1], [DATE 2], [DATE 3] with real times)
${separator}
${draftText}
${separator}`;
}
