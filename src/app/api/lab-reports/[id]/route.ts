import { LabReportStatus } from "@prisma/client";
import type { NextRequest } from "next/server";

import { auth } from "@/shared/server/auth";
import { db } from "@/shared/server/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;

  const report = await db.labReport.findFirst({
    where: { id, userId, deletedAt: null },
  });

  if (!report) {
    return new Response("Not found", { status: 404 });
  }

  return Response.json(report);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;

  const existing = await db.labReport.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!existing) {
    return new Response("Not found", { status: 404 });
  }

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
  const collectedAt =
    typeof body.collectedAt === "string" ? body.collectedAt : undefined;
  const receivedAt =
    typeof body.receivedAt === "string" ? body.receivedAt : undefined;
  const status = body.status;

  const updated = await db.labReport.update({
    where: { id },
    data: {
      title: title ?? existing.title,
      providerName: providerName ?? existing.providerName,
      accessionNumber: accessionNumber ?? existing.accessionNumber,
      orderId: orderId ?? existing.orderId,
      collectedAt: collectedAt ? new Date(collectedAt) : existing.collectedAt,
      receivedAt: receivedAt ? new Date(receivedAt) : existing.receivedAt,
      status:
        typeof status === "string" && status in LabReportStatus
          ? (status as LabReportStatus)
          : existing.status,
    },
  });

  return Response.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;

  const existing = await db.labReport.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!existing) {
    return new Response("Not found", { status: 404 });
  }

  await db.labReport.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return new Response(null, { status: 204 });
}
