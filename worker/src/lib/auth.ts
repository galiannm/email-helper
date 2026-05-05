import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { D1Dialect } from "kysely-d1";
import { Resend } from "resend";
import { Env } from "../types";

export function getRootUsers(env: Env): string[] {
  return env.ROOT_USERS
    ? env.ROOT_USERS.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
    : [];
}

export function isRootUser(email: string, env: Env): boolean {
  return getRootUsers(env).includes(email.toLowerCase());
}

export async function isEmailAllowed(email: string, env: Env): Promise<boolean> {
  if (isRootUser(email, env)) return true;
  const row = await env.DB.prepare(
    'SELECT id FROM "AllowedEmail" WHERE email = ? LIMIT 1'
  )
    .bind(email.toLowerCase())
    .first();
  return !!row;
}

export function createAuth(env: Env) {
  const resend = new Resend(env.RESEND_API_KEY);

  return betterAuth({
    database: {
      dialect: new D1Dialect({ database: env.DB }),
      type: "sqlite",
    },
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: { enabled: false },
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          const allowed = await isEmailAllowed(email, env);
          if (!allowed) {
            throw new Error("This email is not authorized to access the platform.");
          }
          try {
            await resend.emails.send({
              from: "Acacia Education <noreply@admin.acacia-education.com>",
              to: email,
              subject: "Sign in to Acacia Email Helper",
              html: `
                <h2>Sign in to Acacia Email Helper</h2>
                <p>Click the link below to sign in. This link expires in 15 minutes.</p>
                <a href="${url}" style="display:inline-block;padding:12px 24px;background:#faa338;color:white;text-decoration:none;border-radius:6px;">Sign In</a>
                <p style="margin-top:16px;color:#666;">Or copy this link: ${url}</p>
                <p style="color:#999;font-size:12px;">If you didn't request this email, you can safely ignore it.</p>
              `,
            });
          } catch (error) {
            console.error("Failed to send magic link:", error);
            throw error;
          }
        },
      }),
    ],
    trustedOrigins: (request) => {
      const trusted = [
        env.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:8787",
      ];
      const tryAdd = (url: string) => {
        try {
          const parsed = new URL(url);
          if (parsed.hostname === "localhost") trusted.push(parsed.origin);
          if (parsed.hostname.endsWith(".pages.dev")) trusted.push(parsed.origin);
        } catch {}
      };
      try {
        const origin = request?.headers.get("origin");
        if (origin) tryAdd(origin);
        const callbackURL = request
          ? new URL(request.url).searchParams.get("callbackURL")
          : null;
        if (callbackURL) tryAdd(callbackURL);
      } catch {}
      return trusted;
    },
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
