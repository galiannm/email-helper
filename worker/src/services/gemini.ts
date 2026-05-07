export interface EmailExtraction {
  parentName: string | null;
  parentEmail: string | null;   // from the "Email address" form field
  childName: string | null;
  childAge: string | null;
  ageInMonths: number | null;
  detectedLanguage: "en" | "fr";
  city: "Bangkok" | "Hanoi" | "PhnomPenh" | "Unknown";
  campusPreference: "Sathorn" | "Sukhumvit" | "TayHo" | "LongBien" | "Unspecified";
  cursus: string | null;        // e.g. "French Section", "International Section"
}

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
};

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
          // Disable thinking tokens — we need clean JSON output
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${error}`);
  }

  const data = (await response.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini");

  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  // Extract the first JSON object — handles any preamble Gemini might add
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) cleaned = match[0];

  return cleaned;
}

export async function extractEmailInfo(
  subject: string,
  rawText: string,
  apiKey: string
): Promise<EmailExtraction> {
  const prompt = `You are parsing a structured form submission email from Acacia Education's website.

The email body contains labelled fields like:
  First Name      <value>
  Last Name       <value>
  Email address   <value>
  Choose a city   <value>
  Cursus          <value>
  Message         <value>

Extract these fields and return ONLY a JSON object with:
- parentName: "First Name" + " " + "Last Name", or null
- parentEmail: the "Email address" field value, or null
- cursus: the "Cursus" field value as-is (e.g. "French Section", "International Section"), or null
- childName: child's name if mentioned in the Message field, or null
- childAge: child's age if mentioned in the Message field (as written, e.g. "2 ans", "18 months"), or null
- ageInMonths: convert childAge to months (2 years = 24, 18 months = 18), or null
- detectedLanguage: "fr" if Cursus contains "French" or message is in French, otherwise "en"
- city: map "Choose a city" to one of "Bangkok" | "Hanoi" | "PhnomPenh" | "Unknown"
- campusPreference: map "Choose a city" to one of "Sathorn" | "Sukhumvit" | "TayHo" | "LongBien" | "Unspecified"

Campus mapping for "Choose a city":
  "Bangkok Sukhumvit" or "Sukhumvit" or "Ekkamai"  → city: Bangkok, campusPreference: Sukhumvit
  "Bangkok Sathorn"   or "Sathorn"   or "Yen Akat" → city: Bangkok, campusPreference: Sathorn
  "Bangkok" (no campus)                             → city: Bangkok, campusPreference: Unspecified
  "Hanoi Tay Ho"      or "Tay Ho"                  → city: Hanoi,   campusPreference: TayHo
  "Hanoi Long Bien"   or "Long Bien"               → city: Hanoi,   campusPreference: LongBien
  "Hanoi" (no campus)                               → city: Hanoi,   campusPreference: Unspecified
  "Phnom Penh"                                      → city: PhnomPenh, campusPreference: Unspecified
  Anything else                                     → city: Unknown, campusPreference: Unspecified

EMAIL SUBJECT: ${subject}

EMAIL CONTENT:
${rawText.slice(0, 4000)}

Return ONLY the JSON object, no markdown.`;

  const text = await callGemini(prompt, apiKey);
  console.log("Gemini raw response:", text);

  let raw: Partial<EmailExtraction & { ageInMonths?: number }>;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse Gemini JSON:", text);
    throw new Error(`Gemini returned invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
  }

  return {
    parentName:        raw.parentName        ?? null,
    parentEmail:       raw.parentEmail       ?? null,
    cursus:            raw.cursus            ?? null,
    childName:         raw.childName         ?? null,
    childAge:          raw.childAge          ?? null,
    ageInMonths:       typeof raw.ageInMonths === "number" ? raw.ageInMonths : null,
    detectedLanguage:  raw.detectedLanguage  === "fr" ? "fr" : "en",
    city: (["Bangkok", "Hanoi", "PhnomPenh", "Unknown"] as const).includes(raw.city as never)
      ? (raw.city as EmailExtraction["city"])
      : "Unknown",
    campusPreference: (
      ["Sathorn", "Sukhumvit", "TayHo", "LongBien", "Unspecified"] as const
    ).includes(raw.campusPreference as never)
      ? (raw.campusPreference as EmailExtraction["campusPreference"])
      : "Unspecified",
  };
}
