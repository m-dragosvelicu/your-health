import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

// Zod schemas for structured extraction
const LabTestSchema = z.object({
  testName: z.string(),
  value: z.number().nullable(),
  rawValue: z.string(),
  unit: z.string().nullable(),
  referenceRange: z.string().nullable(),
  status: z.enum(["normal", "high", "low", "critical"]).nullable(),
  section: z.string().nullable().optional(),
});

const ParsedLabSchema = z.object({
  patient: z.object({
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    birthdate: z.string().nullable(), // ISO date string YYYY-MM-DD
  }),
  meta: z.object({
    provider: z.string().nullable(),
    samplingDate: z.string().nullable(), // ISO datetime
    resultDate: z.string().nullable(), // ISO datetime
  }),
  tests: z.array(LabTestSchema),
});

export type ParsedLab = z.infer<typeof ParsedLabSchema>;
export type LabTest = z.infer<typeof LabTestSchema>;

/**
 * Parse lab report PDF using Google Gemini 2.5 Flash Image (Nano Banana)
 *
 * This uses Gemini's vision capabilities to extract structured data from
 * medical lab reports in PDF format.
 */
export async function parseLabReportWithGemini(pdfBuffer: Buffer): Promise<ParsedLab> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  // Initialize Gemini
  const genAI = new GoogleGenerativeAI(apiKey);

  // Use Gemini 2.5 Pro
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  // Convert PDF buffer to base64 for Gemini
  const pdfPart = {
    inlineData: {
      data: pdfBuffer.toString("base64"),
      mimeType: "application/pdf",
    },
  };

  // Structured extraction prompt
  const prompt = `You are a medical data extraction assistant. Extract ALL lab test values from this medical lab report PDF.

Return a JSON object with this EXACT structure:

{
  "patient": {
    "firstName": "string or null",
    "lastName": "string or null",
    "birthdate": "YYYY-MM-DD or null"
  },
  "meta": {
    "provider": "Lab provider/company name or null",
    "samplingDate": "YYYY-MM-DDTHH:mm:ss or null (when sample was taken)",
    "resultDate": "YYYY-MM-DDTHH:mm:ss or null (when results were available)"
  },
  "tests": [
    {
      "testName": "Full name of the test",
      "value": number or null,
      "rawValue": "exact value as written including symbols like > or <",
      "unit": "unit of measurement (mg/dL, U/L, etc.) or null",
      "referenceRange": "reference range exactly as written or null",
      "status": "normal" | "high" | "low" | "critical" | null,
      "section": "category/panel name (e.g., Biochemistry, Hematology) or null"
    }
  ]
}

RULES:
- Extract EVERY test result from the report
- For values like ">4000" or "<0.5": set value=null, include symbols in rawValue
- Convert all dates to ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
- Determine status by comparing value to referenceRange (if both exist)
- Use null for any missing information
- Preserve exact units and reference ranges as written
- Include section/panel names if visible (e.g., "Biochemistry", "Hematology")

Return ONLY the JSON object, no markdown formatting or extra text.`;

  console.log("🔬 Sending PDF to Gemini for extraction...");

  // Generate content
  const result = await model.generateContent([prompt, pdfPart]);
  const response = result.response;
  const text = response.text();

  console.log("📄 Raw Gemini response:", text.substring(0, 200) + "...");

  // Parse and validate with Zod
  let jsonData: unknown;
  try {
    // Try parsing as direct JSON first
    jsonData = JSON.parse(text);
  } catch {
    // If that fails, try extracting from markdown code block
    const fencedMatch = /```(?:json)?\s*(\{[\s\S]*\})\s*```/.exec(text);
    const jsonMatch = fencedMatch ?? /(\{[\s\S]*\})/.exec(text);

    if (!jsonMatch?.[1]) {
      throw new Error("Failed to extract JSON from Gemini response");
    }

    jsonData = JSON.parse(jsonMatch[1]);
  }

  // Validate and return
  const parsed = ParsedLabSchema.parse(jsonData);

  console.log(`✅ Extracted ${parsed.tests.length} lab tests`);

  return parsed;
}
