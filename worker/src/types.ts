import { PrismaClient } from "@prisma/client";
import type { Auth } from "./lib/auth";

export const CAMPUS_CODES = ["SATHORN", "SUKHUMVIT", "HANOI_TAYHO", "HANOI_LONGBIEN", "PHNOM_PENH", "DEFAULT"] as const;
export type CampusCode = (typeof CAMPUS_CODES)[number];

export const SECTION_CODES = ["EXPLORERS", "ADVENTURERS", "TRAVELERS", "GLOBETROTTERS"] as const;
export type SectionCode = (typeof SECTION_CODES)[number];

export const CAMPUS_REGION: Record<string, string> = {
  SATHORN: "bangkok",
  SUKHUMVIT: "bangkok",
  HANOI_TAYHO: "hanoi",
  HANOI_LONGBIEN: "hanoi",
  PHNOM_PENH: "phnomPenh",
  DEFAULT: "bangkok",
};

export const EMAIL_STATUSES = ["new", "processing", "ready", "sent", "error"] as const;
export type EmailStatus = (typeof EMAIL_STATUSES)[number];

export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  RESEND_API_KEY: string;
  GEMINI_API_KEY: string;
  BETTER_AUTH_SECRET: string;
  FRONTEND_URL: string;
  INTERNAL_API_KEY?: string;
  ROOT_USERS: string;
}

export interface Variables {
  prisma: PrismaClient;
  auth: Auth;
  user?: {
    id: string;
    email: string;
  };
}

export interface EmailExtraction {
  parentName: string | null;
  childName: string | null;
  childAge: string | null;
  detectedLanguage: "en" | "fr";
  detectedCampus: string;
  sectionCode: string | null;
}
