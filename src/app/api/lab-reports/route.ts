import { LabReportStatus, type Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";

import { auth } from "@/shared/server/auth";
import { db } from "@/shared/server/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const dateFromParam = searchParams.get("dateFrom");
  const dateToParam = searchParams.get("dateTo");
  const limitParam = searchParams.get("limit") ?? "20";
  const cursor = searchParams.get("cursor");

  const limit = Math.min(Math.max(parseInt(limitParam, 10) || 20, 1), 50);

  const where: Prisma.LabReportWhereInput = { userId, deletedAt: null };

  if (statusParam && statusParam in LabReportStatus) {
    where.status = statusParam as LabReportStatus;
  }

  if (dateFromParam || dateToParam) {
    where.collectedAt = {};
    if (dateFromParam) where.collectedAt.gte = new Date(dateFromParam);
    if (dateToParam) where.collectedAt.lte = new Date(dateToParam);
  }

  const items = await db.labReport.findMany({
    where,
    orderBy: [{ collectedAt: "desc" }, { createdAt: "desc" }, { id: "asc" }],
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
  });

  let nextCursor: string | null = null;
  if (items.length > limit) {
    const last = items.pop()!;
    nextCursor = last.id;
  }

  return Response.json({ items, nextCursor });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  const body = (await req.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  if (!body) {
    return new Response("Invalid JSON", { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title : undefined;
  const providerName =
    typeof body.providerName === "string" ? body.providerName : undefined;
  const accessionNumber =
    typeof body.accessionNumber === "string" ? body.accessionNumber : undefined;
  const orderId = typeof body.orderId === "string" ? body.orderId : undefined;
  const collectedAt = body.collectedAt as string | undefined;
  const receivedAt = body.receivedAt as string | undefined;

  const created = await db.labReport.create({
    data: {
      userId,
      title: title ?? null,
      providerName: providerName ?? null,
      accessionNumber: accessionNumber ?? null,
      orderId: orderId ?? null,
      collectedAt: collectedAt ? new Date(collectedAt) : null,
      receivedAt: receivedAt ? new Date(receivedAt) : null,
    },
  });

  return Response.json(created, { status: 201 });
}
