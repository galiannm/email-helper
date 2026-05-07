import { v4 as uuidv4 } from "uuid";
import { createPrismaClient } from "../lib/db";
import { Env } from "../types";
import { runPipeline } from "./pipeline";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

// ── Auth ──────────────────────────────────────────────────────────────────────

async function getGraphToken(tenantId: string, clientId: string, clientSecret: string): Promise<string> {
  const resp = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     clientId,
        client_secret: clientSecret,
        scope:         "https://graph.microsoft.com/.default",
        grant_type:    "client_credentials",
      }),
    }
  );
  const data = (await resp.json()) as { access_token?: string; error_description?: string };
  if (!data.access_token) throw new Error(`Graph auth failed: ${data.error_description}`);
  return data.access_token;
}

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    // Ask Graph to return body as plain text instead of HTML
    Prefer: 'outlook.body-content-type="text"',
  };
}

// ── Graph helpers ─────────────────────────────────────────────────────────────

type GraphMessage = {
  id: string;
  subject?: string;
  receivedDateTime?: string;
  from?: { emailAddress?: { address?: string; name?: string } };
  body?: { content?: string; contentType?: string };
};

// Only process platform-generated inquiry emails forwarded from no-reply.
// Expand to include other senders later when needed.
const ALLOWED_SENDERS = ["no-reply@acacia-education.com"];

async function getUnreadEmails(token: string, mailbox: string): Promise<GraphMessage[]> {
  const senderFilter = ALLOWED_SENDERS
    .map(s => `from/emailAddress/address eq '${s}'`)
    .join(" or ");

  // Only process emails received today (from midnight UTC) to avoid flooding
  // the pipeline with old historical emails when the poller first runs.
  const todayMidnight = new Date();
  todayMidnight.setUTCHours(0, 0, 0, 0);
  const since = todayMidnight.toISOString();

  const url =
    `${GRAPH_BASE}/users/${mailbox}/mailFolders/Inbox/messages` +
    `?$filter=isRead eq false and (${senderFilter}) and receivedDateTime ge ${since}` +
    `&$select=id,from,subject,body,receivedDateTime` +
    `&$top=50`;

  const resp = await fetch(url, { headers: headers(token) });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Graph getUnreadEmails failed: ${resp.status} ${err}`);
  }
  const data = (await resp.json()) as { value?: GraphMessage[] };
  return data.value ?? [];
}

async function markAsRead(token: string, mailbox: string, messageId: string): Promise<void> {
  await fetch(`${GRAPH_BASE}/users/${mailbox}/messages/${messageId}`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify({ isRead: true }),
  });
}

async function getOrCreateFolder(token: string, mailbox: string, name: string): Promise<string> {
  const resp = await fetch(`${GRAPH_BASE}/users/${mailbox}/mailFolders?$top=100`, {
    headers: headers(token),
  });
  const data = (await resp.json()) as { value?: Array<{ id: string; displayName: string }> };
  const existing = (data.value ?? []).find(
    (f) => f.displayName.toLowerCase() === name.toLowerCase()
  );
  if (existing) return existing.id;

  const created = await fetch(`${GRAPH_BASE}/users/${mailbox}/mailFolders`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ displayName: name }),
  });
  const folder = (await created.json()) as { id: string };
  return folder.id;
}

async function moveToFolder(token: string, mailbox: string, messageId: string, folderId: string): Promise<void> {
  await fetch(`${GRAPH_BASE}/users/${mailbox}/messages/${messageId}/move`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ destinationId: folderId }),
  });
}

// ── Body cleanup ──────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractBodyText(msg: GraphMessage): string {
  const body = msg.body;
  if (!body?.content) return "";
  if (body.contentType?.toLowerCase() === "html") return stripHtml(body.content);
  return body.content.trim();
}

// ── Poll status ───────────────────────────────────────────────────────────────

async function setPollStatus(
  db: D1Database,
  status: "running" | "done" | "error",
  processed = 0,
  error?: string
): Promise<void> {
  await db
    .prepare('INSERT OR REPLACE INTO "PollStatus" (key, value, updatedAt) VALUES (?, ?, ?)')
    .bind(
      "inbox_poll",
      JSON.stringify({ status, processed, ...(error ? { error } : {}) }),
      new Date().toISOString()
    )
    .run();
}

export async function getPollStatus(
  db: D1Database
): Promise<{ status: string; processed: number; updatedAt: string; error?: string } | null> {
  const row = await db
    .prepare('SELECT value, updatedAt FROM "PollStatus" WHERE key = ?')
    .bind("inbox_poll")
    .first<{ value: string; updatedAt: string }>();
  if (!row) return null;
  return { ...JSON.parse(row.value), updatedAt: row.updatedAt };
}

// ── Main poller ───────────────────────────────────────────────────────────────

export async function pollGraphInbox(env: Env): Promise<void> {
  const { GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET, GRAPH_MAILBOX } = env;

  if (!GRAPH_TENANT_ID || !GRAPH_CLIENT_ID || !GRAPH_CLIENT_SECRET || !GRAPH_MAILBOX) {
    console.log("Graph poller: not configured, skipping");
    return;
  }

  const prisma = createPrismaClient(env.DB);
  await setPollStatus(env.DB, "running");

  try {
    const token = await getGraphToken(GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET);
    const processedFolderId = await getOrCreateFolder(token, GRAPH_MAILBOX, "Processed");
    const messages = await getUnreadEmails(token, GRAPH_MAILBOX);

    console.log(`Graph poller: ${messages.length} unread message(s)`);

    let processed = 0;

    for (const msg of messages) {
      const from    = msg.from?.emailAddress?.address ?? "unknown";
      const subject = msg.subject ?? "(no subject)";
      const rawText = extractBodyText(msg);

      console.log(`Processing: '${subject}' from ${from}`);

      try {
        const emailId     = uuidv4();
        const rawEmailKey = `emails/${emailId}/raw.txt`;

        // Archive raw text in R2
        await env.BUCKET.put(rawEmailKey, rawText, {
          httpMetadata: { contentType: "text/plain" },
        });

        // Save to D1
        await prisma.incomingEmail.create({
          data: {
            id:           emailId,
            fromAddress:  from,
            toAddress:    GRAPH_MAILBOX,
            subject,
            rawText,
            rawEmailKey,
          },
        });

        // Mark read + move to Processed folder before pipeline
        // (so a pipeline failure won't cause re-processing on next poll)
        await markAsRead(token, GRAPH_MAILBOX, msg.id);
        await moveToFolder(token, GRAPH_MAILBOX, msg.id, processedFolderId);

        // Run AI pipeline
        await runPipeline(emailId, env);

        processed++;
        console.log(`  Done: emailId=${emailId}`);
      } catch (err) {
        console.error(`  Failed to process '${subject}' from ${from}:`, err);
        // Leave as read + moved — admin can regenerate from the UI
      }
    }

    await setPollStatus(env.DB, "done", processed);
    console.log(`Graph poller: done, processed ${processed}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Graph poller failed:", msg);
    await setPollStatus(env.DB, "error", 0, msg);
  }
}
