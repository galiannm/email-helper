export interface EmailExtraction {
  parentName: string | null;
  childName: string | null;
  childAge: string | null;
  ageInMonths: number | null;
  detectedLanguage: "en" | "fr";
  city: "Bangkok" | "Hanoi" | "PhnomPenh" | "Unknown";
  campusPreference: "Sathorn" | "Sukhumvit" | "TayHo" | "LongBien" | "Unspecified";
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
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
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

  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  return cleaned.trim();
}

export async function extractEmailInfo(
  subject: string,
  rawText: string,
  apiKey: string
): Promise<EmailExtraction> {
  const prompt = `You are an assistant that extracts information from parent inquiry emails to Acacia Education, an international preschool with campuses in Bangkok, Hanoi, and Phnom Penh.

Extract the following from the email and return ONLY a JSON object:
- parentName: string or null (parent's name from greeting/signature)
- childName: string or null (child's name)
- childAge: string or null (age as written, e.g. "2 years old", "18 months", "3 ans")
- ageInMonths: number or null (convert to months: 2 years = 24, 18 months = 18, 3.5 years = 42)
- detectedLanguage: "en" or "fr" (language of the email)
- city: "Bangkok" | "Hanoi" | "PhnomPenh" | "Unknown"
- campusPreference: "Sathorn" | "Sukhumvit" | "TayHo" | "LongBien" | "Unspecified"

Location hints:
- Bangkok campuses: Yen Akat / Sathorn area = Sathorn, Ekkamai / Sukhumvit area = Sukhumvit
- Hanoi campuses: Tay Ho and Long Bien
- If no specific campus mentioned, use "Unspecified"
- If city is unclear, use "Unknown"

EMAIL SUBJECT: ${subject}

EMAIL CONTENT:
${rawText.slice(0, 4000)}

Return ONLY the JSON object, no markdown.`;

  const text = await callGemini(prompt, apiKey);
  const raw = JSON.parse(text) as Partial<EmailExtraction>;

  return {
    parentName: raw.parentName ?? null,
    childName: raw.childName ?? null,
    childAge: raw.childAge ?? null,
    ageInMonths: raw.ageInMonths ?? null,
    detectedLanguage: raw.detectedLanguage === "fr" ? "fr" : "en",
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
