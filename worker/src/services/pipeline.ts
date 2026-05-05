import { createPrismaClient } from "../lib/db";
import { Env, CAMPUS_REGION } from "../types";
import { extractEmailInfo, EmailExtraction } from "./gemini";

// ── Routing ───────────────────────────────────────────────────────────────────

function mapToCampusCode(ex: EmailExtraction): string {
  const { city, campusPreference } = ex;
  if (city === "PhnomPenh") return "PHNOM_PENH";
  if (city === "Hanoi") {
    if (campusPreference === "TayHo") return "HANOI_TAYHO";
    if (campusPreference === "LongBien") return "HANOI_LONGBIEN";
    return "HANOI_UNSPECIFIED";
  }
  if (city === "Bangkok") {
    if (campusPreference === "Sathorn") return "SATHORN";
    if (campusPreference === "Sukhumvit") return "SUKHUMVIT";
    return "BANGKOK_UNSPECIFIED";
  }
  return "UNKNOWN";
}

function routeToDirector(campusCode: string, lang: "en" | "fr"): string {
  switch (campusCode) {
    case "SATHORN":            return "SATHORN";
    case "SUKHUMVIT":          return "SUKHUMVIT";
    case "HANOI_TAYHO":        return "HANOI_TAYHO";
    case "HANOI_LONGBIEN":     return "HANOI_LONGBIEN";
    case "PHNOM_PENH":         return "PHNOM_PENH";
    case "HANOI_UNSPECIFIED":  return "HANOI_TAYHO";
    case "BANGKOK_UNSPECIFIED":
    case "UNKNOWN":
    default:
      return lang === "fr" ? "SATHORN" : "SUKHUMVIT";
  }
}

function mapAgeToSection(ageInMonths: number | null): string | null {
  if (ageInMonths === null) return null;
  if (ageInMonths < 18) return null;         // Too young (handled separately)
  if (ageInMonths < 36) return "EXPLORERS";
  if (ageInMonths < 48) return "ADVENTURERS";
  if (ageInMonths < 60) return "TRAVELERS";
  if (ageInMonths < 84) return "GLOBETROTTERS";
  return null;
}

// ── Template assembly ─────────────────────────────────────────────────────────

type Template = { part: string; textEn: string; textFr: string };
type Section  = { nameEn: string; ageRangeEn: string; nameFr: string; ageRangeFr: string };
type Director = { id: string; name: string; signatureEn: string | null; signatureFr: string | null };

function getPart(templates: Template[], part: string, lang: "en" | "fr"): string {
  const t = templates.find((t) => t.part === part);
  if (!t) return "";
  return lang === "fr" ? t.textFr : t.textEn;
}

function fillVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

function campusLabel(campusCode: string): string {
  const labels: Record<string, string> = {
    SATHORN: "Sathorn",
    SUKHUMVIT: "Sukhumvit",
    HANOI_TAYHO: "Tay Ho",
    HANOI_LONGBIEN: "Long Bien",
    PHNOM_PENH: "Phnom Penh",
  };
  return labels[campusCode] ?? "[Campus]";
}

function assembleDraft(
  templates: Template[],
  section: Section | null,
  director: Director,
  ex: EmailExtraction,
  campusCode: string
): string {
  const lang = ex.detectedLanguage;
  const campus = CAMPUS_REGION[director.id] ?? "bangkok";
  const isTooYoung =
    !section && ex.ageInMonths !== null && ex.ageInMonths < 18;

  const vars: Record<string, string> = {
    parent_name:  ex.parentName  ?? "[Parent Name]",
    child_name:   ex.childName   ?? "[Child Name]",
    age:          ex.childAge    ?? "[Age]",
    section_name: section ? (lang === "fr" ? section.nameFr    : section.nameEn)      : "[Section]",
    age_range:    section ? (lang === "fr" ? section.ageRangeFr : section.ageRangeEn) : "[Age Range]",
    campus_name:  campusLabel(campusCode),
    date_time_1: "[DATE 1]",
    date_time_2: "[DATE 2]",
    date_time_3: "[DATE 3]",
  };

  const get = (part: string) => fillVars(getPart(templates, part, lang), vars);

  const parts: string[] = [];

  if (campus === "bangkok") {
    parts.push(get("greeting"));
    if (section) parts.push(get("childWelcome"));
    parts.push(get("programDescription"));
    parts.push(get("internationalOption"));
    if (campusCode === "SATHORN") {
      parts.push(get("sathornDescription"));
    } else if (campusCode === "SUKHUMVIT") {
      parts.push(get("sukhumvitDescription"));
    } else {
      parts.push(get("locationChoice"));
    }
    parts.push(get("visitOffer"));
    parts.push(get("attachments"));
    parts.push(get("closing"));
    const sig = lang === "fr" ? director.signatureFr : director.signatureEn;
    if (sig) parts.push(sig);

  } else if (campus === "hanoi") {
    parts.push(get("greeting"));
    if (section) parts.push(get("childWelcome"));
    parts.push(get("programDescription"));
    parts.push(get("visitOffer"));
    parts.push(get("attachments"));
    parts.push(get("closing"));
    const sig = lang === "fr" ? director.signatureFr : director.signatureEn;
    if (sig) parts.push(sig);

  } else {
    // phnomPenh
    parts.push(get("greeting"));
    if (section) parts.push(get("childWelcome"));
    parts.push(get("aefeHighlight"));
    if (isTooYoung) parts.push(get("under18Months"));
    parts.push(get("visitOffer"));
    parts.push(get("attachments"));
    parts.push(get("closing")); // PP closing already contains the full signature
  }

  return parts.filter(Boolean).join("\n\n");
}

// ── Main pipeline ─────────────────────────────────────────────────────────────

export async function runPipeline(emailId: string, env: Env): Promise<void> {
  const prisma = createPrismaClient(env.DB);

  try {
    const email = await prisma.incomingEmail.findUnique({ where: { id: emailId } });
    if (!email) return;

    await prisma.incomingEmail.update({
      where: { id: emailId },
      data: { status: "processing" },
    });

    const ex = await extractEmailInfo(email.subject, email.rawText, env.GEMINI_API_KEY);

    const campusCode = mapToCampusCode(ex);
    const sectionCode = mapAgeToSection(ex.ageInMonths);
    const directorId = routeToDirector(campusCode, ex.detectedLanguage);

    // Upsert extraction (handle regenerate case)
    await prisma.extractedInfo.upsert({
      where: { emailId },
      create: {
        emailId,
        parentName:       ex.parentName,
        childName:        ex.childName,
        childAge:         ex.childAge,
        detectedLanguage: ex.detectedLanguage,
        detectedCampus:   campusCode,
        sectionCode,
      },
      update: {
        parentName:       ex.parentName,
        childName:        ex.childName,
        childAge:         ex.childAge,
        detectedLanguage: ex.detectedLanguage,
        detectedCampus:   campusCode,
        sectionCode,
      },
    });

    const [director, section, templates] = await Promise.all([
      prisma.director.findUnique({ where: { id: directorId } }),
      sectionCode ? prisma.section.findUnique({ where: { code: sectionCode } }) : null,
      prisma.template.findMany({ where: { campus: CAMPUS_REGION[directorId] ?? "bangkok" } }),
    ]);

    if (!director) throw new Error(`Director not found: ${directorId}`);

    const draftText = assembleDraft(templates, section, director, ex, campusCode);

    // Upsert draft (handle regenerate case)
    await prisma.emailDraft.upsert({
      where: { emailId },
      create: { emailId, directorCampusCode: directorId, draftText },
      update: { directorCampusCode: directorId, draftText, editedAt: null, sentAt: null },
    });

    await prisma.incomingEmail.update({
      where: { id: emailId },
      data: { status: "ready", errorMessage: null },
    });
  } catch (error) {
    console.error(`Pipeline failed for email ${emailId}:`, error);
    try {
      const prismaRetry = createPrismaClient(env.DB);
      await prismaRetry.incomingEmail.update({
        where: { id: emailId },
        data: {
          status: "error",
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      });
    } catch (e) {
      console.error("Failed to update error status:", e);
    }
  }
}
