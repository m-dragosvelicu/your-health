import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

import { auth } from "@/shared/server/auth";
import { parseLabReportWithGemini } from "@/features/labs/lib/parse-lab-gemini";
import { saveParsedLab } from "@/features/labs/lib/save-lab";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "Missing file field named `file`." },
      { status: 400 },
    );
  }

  if (file.type !== "application/pdf") {
    // Some browsers may omit type; we only hard-reject obvious non-PDFs.
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".pdf")) {
      return NextResponse.json(
        { ok: false, error: "Only PDF files are supported." },
        { status: 400 },
      );
    }
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let rawFilePath: string | null = null;

  // Best-effort local persistence of the original PDF.
  try {
    const id = randomUUID();
    const relativePath = path.join("uploads", "labs", `${id}.pdf`);
    const fullPath = path.join(process.cwd(), "public", relativePath);

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);

    rawFilePath = relativePath.replace(/\\/g, "/");
  } catch (err) {
    // In serverless environments this may fail; we still proceed with parsing + DB.
    console.error("[labs-upload] Failed to persist PDF file", err);
  }

  try {
    // Use Gemini AI to parse the lab report (works with any provider format)
    const geminiParsed = await parseLabReportWithGemini(buffer);

    // Return preview data WITHOUT saving to DB yet
    // The user will confirm via /api/labs/confirm endpoint
    return NextResponse.json(
      {
        ok: true,
        preview: {
          patient: {
            last_name: geminiParsed.patient.lastName,
            first_name: geminiParsed.patient.firstName,
            birthdate: geminiParsed.patient.birthdate,
          },
          meta: {
            provider: geminiParsed.meta.provider ?? "Unknown",
            sampling_date: geminiParsed.meta.samplingDate,
            result_date: geminiParsed.meta.resultDate,
            raw_file_path: rawFilePath,
          },
          tests: geminiParsed.tests.map(test => ({
            section: test.section ?? "Other",
            name: test.testName,
            value: test.value,
            rawValue: test.rawValue,
            unit: test.unit ?? "",
            refRaw: test.referenceRange ?? "",
          })),
          rejectedLines: [],
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[labs-upload] Failed to parse or save lab PDF", err);
    return NextResponse.json(
      { ok: false, error: "Failed to parse lab results." },
      { status: 500 },
    );
  }
}

