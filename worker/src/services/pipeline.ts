import { createPrismaClient } from "../lib/db";
import { Env } from "../types";
import { extractEmailInfo, EmailExtraction } from "./gemini";

// ── Routing helpers ───────────────────────────────────────────────────────────

function cityToLocation(city: EmailExtraction["city"]): string {
  switch (city) {
    case "Bangkok":   return "bangkok";
    case "Hanoi":     return "hanoi";
    case "PhnomPenh": return "phnomPenh";
    default:          return "bangkok";
  }
}

function cursusToSection(cursus: string | null): "french" | "international" {
  if (!cursus) return "french";
  const l = cursus.toLowerCase();
  if (l.includes("french") || l.includes("français") || l.includes("francais") || l.includes("bilingue")) {
    return "french";
  }
  return "international";
}

// Still useful for saving detectedCampus (informational) and {campus_name} variable
function campusNameFromPref(city: string, campusPreference: string): string {
  if (city === "Bangkok") {
    if (campusPreference === "Sathorn")   return "Sathorn";
    if (campusPreference === "Sukhumvit") return "Sukhumvit";
  }
  if (city === "Hanoi") {
    if (campusPreference === "TayHo")   return "Tay Ho";
    if (campusPreference === "LongBien") return "Long Bien";
    return "Hanoi";
  }
  if (city === "PhnomPenh") return "Phnom Penh";
  return "[Campus]";
}

function mapAgeToSection(ageInMonths: number | null): string | null {
  if (ageInMonths === null) return null;
  if (ageInMonths < 18) return null;
  if (ageInMonths < 36) return "EXPLORERS";
  if (ageInMonths < 48) return "ADVENTURERS";
  if (ageInMonths < 60) return "TRAVELERS";
  if (ageInMonths < 84) return "GLOBETROTTERS";
  return null;
}

// ── Template assembly ─────────────────────────────────────────────────────────

type Template  = { part: string; textEn: string; textFr: string };
type AgeSection = { nameEn: string; ageRangeEn: string; nameFr: string; ageRangeFr: string };
type Director  = {
  id: string;
  name: string;
  location: string;
  section: string;
  signatureEn: string | null;
  signatureFr: string | null;
};

function getPart(templates: Template[], part: string, lang: "en" | "fr"): string {
  const t = templates.find((t) => t.part === part);
  if (!t) return "";
  return lang === "fr" ? t.textFr : t.textEn;
}

function fillVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

function assembleDraft(
  templates: Template[],
  ageSection: AgeSection | null,
  director: Director,
  ex: EmailExtraction,
  campusName: string,
): string {
  // Language comes from the parent's email language, never from the section/cursus
  const lang   = ex.detectedLanguage;
  const campus = director.location;          // "bangkok" | "hanoi" | "phnomPenh"
  const dirSec = director.section;           // "french" | "international" | "both"
  const isTooYoung = !ageSection && ex.ageInMonths !== null && ex.ageInMonths < 18;

  const vars: Record<string, string> = {
    parent_name:  ex.parentName ?? "[Parent Name]",
    child_name:   ex.childName  ?? "[Child Name]",
    age:          ex.childAge   ?? "[Age]",
    section_name: ageSection
      ? (lang === "fr" ? ageSection.nameFr    : ageSection.nameEn)
      : "[Section]",
    age_range: ageSection
      ? (lang === "fr" ? ageSection.ageRangeFr : ageSection.ageRangeEn)
      : "[Age Range]",
    campus_name:  campusName,
    date_time_1: "[DATE 1]",
    date_time_2: "[DATE 2]",
    date_time_3: "[DATE 3]",
  };

  const get = (part: string) => fillVars(getPart(templates, part, lang), vars);
  const parts: string[] = [];

  if (campus === "bangkok") {
    parts.push(get("greeting"));
    if (ageSection) parts.push(get("childWelcome"));
    parts.push(get("programDescription"));
    parts.push(get("internationalOption"));
    // Which campus description to include is driven by the DIRECTOR's section
    if (dirSec === "french") {
      parts.push(get("sathornDescription"));
    } else if (dirSec === "international") {
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
    if (ageSection) parts.push(get("childWelcome"));
    parts.push(get("programDescription"));
    parts.push(get("visitOffer"));
    parts.push(get("attachments"));
    parts.push(get("closing"));
    const sig = lang === "fr" ? director.signatureFr : director.signatureEn;
    if (sig) parts.push(sig);

  } else {
    // phnomPenh
    parts.push(get("greeting"));
    if (ageSection) parts.push(get("childWelcome"));
    parts.push(get("aefeHighlight"));
    if (isTooYoung) parts.push(get("under18Months"));
    parts.push(get("visitOffer"));
    parts.push(get("attachments"));
    parts.push(get("closing")); // PP closing already contains the director's full signature
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

    const location   = cityToLocation(ex.city);
    const section    = cursusToSection(ex.cursus);
    const sectionCode = mapAgeToSection(ex.ageInMonths);

    // Informational campus code (what the parent stated — stored but not used for routing)
    const detectedCampus = `${ex.city}_${ex.campusPreference}`.toUpperCase();

    // ── Find director by location + section ───────────────────────────────────
    const director =
      (await prisma.director.findFirst({
        where: { location, section: { in: [section, "both"] } },
      })) ??
      (await prisma.director.findFirst({ where: { id: "DEFAULT" } })) ??
      (await prisma.director.findFirst());

    if (!director) throw new Error("No director found — please configure at least one director");

    // Upsert extraction
    await prisma.extractedInfo.upsert({
      where: { emailId },
      create: {
        emailId,
        parentName:       ex.parentName,
        parentEmail:      ex.parentEmail,
        cursus:           ex.cursus,
        childName:        ex.childName,
        childAge:         ex.childAge,
        detectedLanguage: ex.detectedLanguage,
        detectedCampus,
        sectionCode,
      },
      update: {
        parentName:       ex.parentName,
        parentEmail:      ex.parentEmail,
        cursus:           ex.cursus,
        childName:        ex.childName,
        childAge:         ex.childAge,
        detectedLanguage: ex.detectedLanguage,
        detectedCampus,
        sectionCode,
      },
    });

    const [ageSection, templates] = await Promise.all([
      sectionCode ? prisma.section.findUnique({ where: { code: sectionCode } }) : null,
      prisma.template.findMany({ where: { campus: director.location } }),
    ]);

    const campusName = campusNameFromPref(ex.city, ex.campusPreference);
    const draftText  = assembleDraft(templates, ageSection, director, ex, campusName);

    await prisma.emailDraft.upsert({
      where: { emailId },
      create: { emailId, directorCampusCode: director.id, draftText },
      update: { directorCampusCode: director.id, draftText, editedAt: null, sentAt: null },
    });

    await prisma.incomingEmail.update({
      where: { id: emailId },
      data: { status: "ready", errorMessage: null },
    });
  } catch (error) {
    console.error(`Pipeline failed for email ${emailId}:`, error);
    try {
      await createPrismaClient(env.DB).incomingEmail.update({
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
