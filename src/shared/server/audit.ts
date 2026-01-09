import type { AuditAction } from "@prisma/client";

import type { Prisma } from "@prisma/client";

import { db } from "@/shared/server/db";

type AuditSubject = {
  type?: string | null;
  id?: string | null;
};

export async function logAudit(params: {
  userId?: string | null;
  action: AuditAction;
  subject?: AuditSubject;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const { userId, action, subject, metadata, ip, userAgent } = params;
  const metaValue = metadata as Prisma.InputJsonValue | undefined;
  try {
    await db.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        subjectType: subject?.type ?? null,
        subjectId: subject?.id ?? null,
        metadata: metaValue,
        ip: ip ?? null,
        userAgent: userAgent ?? null,
      },
    });
  } catch {
    // best-effort; swallow errors in audit logging for MVP
  }
}
