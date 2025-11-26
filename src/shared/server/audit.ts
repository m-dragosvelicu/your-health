import { Prisma } from "@prisma/client";
import type { AuditAction } from "@prisma/client";

import { getClientIp } from "@/shared/server/http/ip";
import { db } from "@/shared/server/db";

type AuditSubject = {
  type?: string | null;
  id?: string | null;
};

type AuditMetadata = Prisma.InputJsonValue | undefined;

type AuditRequestContext = {
  request?: Request;
  ip?: string | null;
  userAgent?: string | null;
};

function resolveRequestContext(context: AuditRequestContext) {
  const ip =
    context.ip ??
    (context.request ? getClientIp(context.request) : null) ??
    null;
  const userAgent =
    context.userAgent ??
    context.request?.headers.get("user-agent")?.slice(0, 500) ??
    null;

  return { ip, userAgent };
}

export async function logAudit(params: {
  userId?: string | null;
  action: AuditAction;
  subject?: AuditSubject;
  metadata?: AuditMetadata;
} & AuditRequestContext) {
  const { userId, action, subject, metadata, request, ip, userAgent } = params;
  const { ip: resolvedIp, userAgent: resolvedUserAgent } = resolveRequestContext({
    request,
    ip,
    userAgent,
  });

  try {
    await db.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        subjectType: subject?.type ?? null,
        subjectId: subject?.id ?? null,
        metadata: metadata ?? Prisma.JsonNull,
        ip: resolvedIp,
        userAgent: resolvedUserAgent,
      },
    });
  } catch (error) {
    console.error("Failed to log audit event:", {
      error,
      params,
    });
  }
}
