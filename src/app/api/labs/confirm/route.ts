import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/shared/server/auth";
import { saveParsedLab } from "@/features/labs/lib/save-lab";

export const runtime = "nodejs";

// Schema for the confirmation request
const ConfirmLabSchema = z.object({
  patient: z.object({
    lastName: z.string().nullable(),
    firstName: z.string().nullable(),
    birthdate: z.string().nullable(),
  }),
  meta: z.object({
    provider: z.string().nullable(),
    samplingDate: z.string().nullable(),
    resultDate: z.string().nullable(),
    rawFilePath: z.string().nullable(),
  }),
  tests: z.array(
    z.object({
      section: z.string().nullable(),
      name: z.string(),
      value: z.number().nullable(),
      rawValue: z.string(),
      unit: z.string().nullable(),
      refRaw: z.string().nullable(),
      isEdited: z.boolean().optional().default(false),
    })
  ),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = ConfirmLabSchema.parse(body);

    // Convert to the format expected by saveParsedLab
    const parsed = {
      patient: {
        lastName: validated.patient.lastName,
        firstName: validated.patient.firstName,
        birthdate: validated.patient.birthdate ? new Date(validated.patient.birthdate) : null,
      },
      meta: {
        provider: validated.meta.provider,
        sampledAt: validated.meta.samplingDate ? new Date(validated.meta.samplingDate) : null,
        resultAt: validated.meta.resultDate ? new Date(validated.meta.resultDate) : null,
      },
      tests: validated.tests.map(test => ({
        section: test.section,
        name: test.name,
        value: test.value,
        rawValue: test.rawValue,
        unit: test.unit,
        refRaw: test.refRaw,
        isEdited: test.isEdited,
      })),
      rejectedLines: [],
    };

    // Save to database
    const lab = await saveParsedLab({
      userId: session.user.id,
      provider: validated.meta.provider ?? "Unknown",
      parsed,
      rawFilePath: validated.meta.rawFilePath,
    });

    return NextResponse.json(
      {
        ok: true,
        labId: lab.id,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[labs-confirm] Failed to save lab", err);
    return NextResponse.json(
      { ok: false, error: "Failed to save lab results." },
      { status: 500 },
    );
  }
}
