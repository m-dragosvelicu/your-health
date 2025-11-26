import {
  AuditAction,
  BiomarkerCategory,
  MeasurementComparator,
  MeasurementFlag,
  MeasurementSource,
  type Prisma,
} from "@prisma/client";
import type { NextRequest } from "next/server";

import { auth } from "@/shared/server/auth";
import { db } from "@/shared/server/db";
import { logAudit } from "@/shared/server/audit";
import { getClientIp } from "@/shared/server/http/ip";

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
  const biomarkerId = searchParams.get("biomarkerId") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const flag = searchParams.get("flag") ?? undefined;
  const measuredAtFrom = searchParams.get("measuredAtFrom") ?? undefined;
  const measuredAtTo = searchParams.get("measuredAtTo") ?? undefined;
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = clampLimit(searchParams.get("limit"), 1, 100, 50);

  const where: Prisma.MeasurementWhereInput = {
    userId,
    deletedAt: null,
  };

  if (biomarkerId) where.biomarkerId = biomarkerId;
  if (flag && flag in MeasurementFlag) where.flag = flag as MeasurementFlag;
  if (category && category in BiomarkerCategory) {
    where.biomarker = { category: category as BiomarkerCategory };
  }
  if (measuredAtFrom || measuredAtTo) {
    where.measuredAt = {};
    if (measuredAtFrom) where.measuredAt.gte = new Date(measuredAtFrom);
    if (measuredAtTo) where.measuredAt.lte = new Date(measuredAtTo);
  }

  const items = await db.measurement.findMany({
    where,
    orderBy: [{ measuredAt: "desc" }, { createdAt: "desc" }, { id: "asc" }],
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    include: {
      biomarker: true,
      labReport: true,
    },
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

  const biomarkerId =
    typeof body.biomarkerId === "string" ? body.biomarkerId : undefined;
  const labReportId =
    typeof body.labReportId === "string" ? body.labReportId : undefined;
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

  if (!biomarkerId || typeof biomarkerId !== "string") {
    return new Response("biomarkerId is required", { status: 400 });
  }
  if (!unit || typeof unit !== "string") {
    return new Response("unit is required", { status: 400 });
  }

  const created = await db.measurement.create({
    data: {
      userId,
      biomarkerId,
      labReportId: typeof labReportId === "string" ? labReportId : undefined,
      measuredAt: measuredAt ? new Date(measuredAt) : new Date(),
      value: typeof value === "string" ? value : undefined,
      comparator:
        comparator && comparator in MeasurementComparator
          ? (comparator as MeasurementComparator)
          : undefined,
      unit,
      referenceLow: typeof referenceLow === "string" ? referenceLow : undefined,
      referenceHigh: typeof referenceHigh === "string" ? referenceHigh : undefined,
      referenceText:
        typeof referenceText === "string" ? referenceText : undefined,
      flag:
        flag && flag in MeasurementFlag ? (flag as MeasurementFlag) : undefined,
      note: typeof note === "string" ? note : undefined,
      source: MeasurementSource.MANUAL,
    },
  });

  await logAudit({
    action: AuditAction.MEASUREMENT_CREATE,
    userId,
    subject: { type: "Measurement", id: created.id },
    metadata: { biomarkerId: created.biomarkerId, source: created.source },
    request: req,
    ip: getClientIp(req),
  });

  return Response.json(created, { status: 201 });
}
