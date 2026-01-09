import {
  MeasurementComparator,
  MeasurementFlag,
  MeasurementSource,
} from "@prisma/client";
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
  const { id: labReportId } = await params;

  const { searchParams } = new URL(req.url);
  const limitParam = searchParams.get("limit") ?? "50";
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 100);

  const items = await db.measurement.findMany({
    where: {
      userId,
      labReportId,
      deletedAt: null,
    },
    orderBy: [{ measuredAt: "desc" }, { id: "asc" }],
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

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const { id: labReportId } = await params;

  const body = (await req.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  if (!body) {
    return new Response("Invalid JSON", { status: 400 });
  }

  const biomarkerId =
    typeof body.biomarkerId === "string" ? body.biomarkerId : undefined;
  const measuredAt = body.measuredAt as string | undefined;
  const value = typeof body.value === "string" ? body.value : undefined;
  const comparator =
    typeof body.comparator === "string" ? body.comparator : undefined;
  const unit = typeof body.unit === "string" ? body.unit : undefined;
  const referenceLow =
    typeof body.referenceLow === "string" ? body.referenceLow : undefined;
  const referenceHigh =
    typeof body.referenceHigh === "string" ? body.referenceHigh : undefined;
  const referenceText =
    typeof body.referenceText === "string" ? body.referenceText : undefined;
  const flag = typeof body.flag === "string" ? body.flag : undefined;
  const note = typeof body.note === "string" ? body.note : undefined;

  if (!biomarkerId || !unit) {
    return new Response("biomarkerId and unit are required", { status: 400 });
  }

  const created = await db.measurement.create({
    data: {
      userId,
      labReportId,
      biomarkerId,
      measuredAt: measuredAt ? new Date(measuredAt) : new Date(),
      value: value ?? null,
      comparator:
        comparator && comparator in MeasurementComparator
          ? (comparator as MeasurementComparator)
          : undefined,
      unit,
      referenceLow,
      referenceHigh,
      referenceText,
      flag:
        flag && flag in MeasurementFlag
          ? (flag as MeasurementFlag)
          : undefined,
      note: note ?? undefined,
      source: MeasurementSource.MANUAL,
    },
  });

  return Response.json(created, { status: 201 });
}
