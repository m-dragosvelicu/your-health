import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type pdfParseModule from "pdf-parse";

// Schema for structured extraction
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
    birthdate: z.string().nullable(), // ISO date string
  }),
  meta: z.object({
    provider: z.string().nullable(),
    samplingDate: z.string().nullable(), // ISO datetime
    resultDate: z.string().nullable(), // ISO datetime
  }),
  tests: z.array(LabTestSchema),
});

type ParsedLab = z.infer<typeof ParsedLabSchema>;

async function loadPdfParse(): Promise<(data: Buffer) => Promise<{ text: string }>> {
  const mod = (await import("pdf-parse")) as typeof pdfParseModule & {
    default: typeof pdfParseModule;
  };
  const fn = (mod.default ?? (mod as unknown as typeof pdfParseModule)) as unknown;
  return fn as (data: Buffer) => Promise<{ text: string }>;
}

export async function parseLabReportWithLLM(pdfBuffer: Buffer): Promise<ParsedLab> {
  // 1. Extract text from PDF
  const pdfParse = await loadPdfParse();
  const { text } = await pdfParse(pdfBuffer);

  // 2. Send to Claude for structured extraction
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `Extract all lab test values from this medical lab report. Return ONLY valid JSON matching this schema:

{
  "patient": {
    "firstName": "string or null",
    "lastName": "string or null",
    "birthdate": "YYYY-MM-DD or null"
  },
  "meta": {
    "provider": "Lab provider name or null",
    "samplingDate": "YYYY-MM-DDTHH:mm:ss or null",
    "resultDate": "YYYY-MM-DDTHH:mm:ss or null"
  },
  "tests": [
    {
      "testName": "Full test name",
      "value": number or null (null if <, >, or text),
      "rawValue": "exact value as written (e.g., '>4000', '67', '4.4')",
      "unit": "unit of measurement or null",
      "referenceRange": "reference range as written or null",
      "status": "normal" | "high" | "low" | "critical" | null,
      "section": "category/section name or null"
    }
  ]
}

Rules:
- Extract ALL test results from the report
- Preserve exact values and units
- For values like ">4000" or "<0.5", set value=null and include in rawValue
- Convert dates to ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
- Set status based on whether value is in reference range
- If information is missing, use null

Lab report text:
${text}`;

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  // 3. Parse and validate response
  const responseText = message.content[0]?.type === "text" ? message.content[0].text : "";

  // Extract JSON from potential markdown code blocks
  const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
                    responseText.match(/(\{[\s\S]*\})/);

  if (!jsonMatch) {
    throw new Error("Failed to extract JSON from LLM response");
  }

  const parsed = JSON.parse(jsonMatch[1]);
  return ParsedLabSchema.parse(parsed);
}
