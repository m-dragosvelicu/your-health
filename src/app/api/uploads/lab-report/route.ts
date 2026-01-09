import { LabReportStatus, StorageProvider } from "@prisma/client";
import type { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

import { auth } from "@/shared/server/auth";
import { db } from "@/shared/server/db";
import { logAudit } from "@/shared/server/audit";

export const runtime = "nodejs";

// Simple disk-based storage for MVP; adjust baseDir as needed.
const uploadBaseDir = path.join(process.cwd(), "uploads");

const ensureUploadDir = () => {
  if (!fs.existsSync(uploadBaseDir)) {
    fs.mkdirSync(uploadBaseDir, { recursive: true });
  }
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return new Response("Content-Type must be multipart/form-data", { status: 415 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return new Response("File is required", { status: 400 });
  }

  const title = toOptionalString(formData.get("title"));
  const providerName = toOptionalString(formData.get("providerName"));
  const collectedAt = toDate(formData.get("collectedAt"));
  const receivedAt = toDate(formData.get("receivedAt"));

  // Persist file to disk
  ensureUploadDir();
  const fileId = randomUUID();
  const ext = guessExtension(file.type ?? undefined);
  const filename = `${fileId}${ext}`;
  const filePath = path.join(uploadBaseDir, filename);
  const arrayBuffer = await file.arrayBuffer();
  await fs.promises.writeFile(filePath, Buffer.from(arrayBuffer));

  const storageObject = await db.storageObject.create({
    data: {
      id: fileId,
      userId,
      provider: StorageProvider.LOCAL,
      bucket: null,
      key: filename,
      url: null,
      mimeType: file.type || null,
      size: file.size,
      sha256: null,
      width: null,
      height: null,
      pageCount: null,
    },
  });

  const labReport = await db.labReport.create({
    data: {
      userId,
      title,
      providerName,
      collectedAt,
      receivedAt,
      sourceFileId: storageObject.id,
      status: LabReportStatus.PENDING,
    },
  });

  void logAudit({
    userId,
    action: "LAB_REPORT_UPLOAD",
    subject: { type: "LabReport", id: labReport.id },
    metadata: { storageObjectId: storageObject.id },
  });

  return Response.json({ labReport, storageObject }, { status: 201 });
}

function toOptionalString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function toDate(value: FormDataEntryValue | null): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function guessExtension(mimeType: string | undefined): string {
  if (!mimeType) return "";
  if (mimeType === "application/pdf") return ".pdf";
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  return "";
}
