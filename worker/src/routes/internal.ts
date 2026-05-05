import { Hono } from "hono";
import { Env, Variables } from "../types";
import { runPipeline } from "../services/pipeline";
import { v4 as uuidv4 } from "uuid";

const internal = new Hono<{ Bindings: Env; Variables: Variables }>();

internal.use("*", async (c, next) => {
  const apiKey = c.req.header("X-Internal-API-Key");
  if (c.env.INTERNAL_API_KEY && apiKey !== c.env.INTERNAL_API_KEY) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
});

internal.post("/ingest-email", async (c) => {
  const body = await c.req.json<{
    from: string;
    to: string;
    subject: string;
    rawText: string;
  }>();

  if (!body.from || !body.rawText) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  const prisma = c.get("prisma");
  const emailId = uuidv4();

  // Store raw email in R2 for archiving
  const rawEmailKey = `emails/${emailId}/raw.txt`;
  await c.env.BUCKET.put(rawEmailKey, body.rawText, {
    httpMetadata: { contentType: "text/plain" },
  });

  await prisma.incomingEmail.create({
    data: {
      id: emailId,
      fromAddress: body.from,
      toAddress: body.to || "contact@acacia-education.com",
      subject: body.subject || "(no subject)",
      rawText: body.rawText,
      rawEmailKey,
    },
  });

  // Run pipeline async — don't block the response
  c.executionCtx.waitUntil(runPipeline(emailId, c.env));

  return c.json({ success: true, emailId }, 201);
});

export default internal;
