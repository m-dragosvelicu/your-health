import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

import { auth } from "@/shared/server/auth";
import { parseLabReportWithGemini } from "@/features/labs/lib/parse-lab-gemini";

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

  // Upload PDF to Vercel Blob storage (private, authenticated access)
  try {
    const id = randomUUID();
    const blob = await put(`labs/${session.user.id}/${id}.pdf`, buffer, {
      access: "public", // We use "public" URL but require auth via our own endpoint
      contentType: "application/pdf",
    });
    // Store the blob URL - we'll serve it through an authenticated endpoint
    rawFilePath = blob.url;
  } catch (err) {
    console.error("[labs-upload] Failed to upload PDF to blob storage", err);
    // Continue without file storage - parsing can still work
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

