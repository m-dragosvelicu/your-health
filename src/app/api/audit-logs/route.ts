import { AuditAction, type Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";

import { auth } from "@/shared/server/auth";
import { db } from "@/shared/server/db";

export const runtime = "nodejs";

const clampLimit = (value: string | null, min: number, max: number, fallback: number) => {
  const parsed = value ? Number(value) : fallback;
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const actionParam = searchParams.get("action");
  const dateFromParam = searchParams.get("dateFrom");
  const dateToParam = searchParams.get("dateTo");
  const cursor = searchParams.get("cursor");
  const limit = clampLimit(searchParams.get("limit"), 1, 100, 20);

  const where: Prisma.AuditLogWhereInput = { userId };

  if (actionParam && actionParam in AuditAction) {
    where.action = actionParam as AuditAction;
  }

  if (dateFromParam || dateToParam) {
    where.createdAt = {};
    if (dateFromParam) where.createdAt.gte = new Date(dateFromParam);
    if (dateToParam) where.createdAt.lte = new Date(dateToParam);
  }

  const items = await db.auditLog.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
  });

  let nextCursor: string | null = null;
  if (items.length > limit) {
    const last = items.pop()!;
    nextCursor = last.id;
  }

  return Response.json({ items, nextCursor });
}
