import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/shared/server/auth";
import { db } from "@/shared/server/db";

export const runtime = "nodejs";

const ParamsSchema = z.object({
  id: z.string().min(1),
});

/**
 * Authenticated file download endpoint for lab PDFs.
 * This ensures users can only access their own lab files.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  const parsed = ParamsSchema.safeParse(resolvedParams);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid lab id", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id } = parsed.data;

  // Find the lab and verify ownership
  const lab = await db.lab.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    select: {
      rawFilePath: true,
      patientLastName: true,
      sampledAt: true,
    },
  });

  if (!lab) {
    return NextResponse.json(
      { ok: false, error: "Lab not found" },
      { status: 404 },
    );
  }

  if (!lab.rawFilePath) {
    return NextResponse.json(
      { ok: false, error: "No file available for this lab" },
      { status: 404 },
    );
  }

  try {
    // Fetch the file from blob storage
    const response = await fetch(lab.rawFilePath);

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status}`);
    }

    const blob = await response.blob();

    // Generate a meaningful filename
    const date = lab.sampledAt ? new Date(lab.sampledAt).toISOString().split('T')[0] : 'unknown-date';
    const filename = `lab-${lab.patientLastName || 'report'}-${date}.pdf`;

    return new NextResponse(blob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (err) {
    console.error("[labs-file] Failed to fetch PDF from storage", err);
    return NextResponse.json(
      { ok: false, error: "Failed to retrieve file" },
      { status: 500 },
    );
  }
}
