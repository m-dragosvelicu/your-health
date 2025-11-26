import {
  AuditAction,
  MeasurementComparator,
  MeasurementFlag,
  MeasurementSource,
} from "@prisma/client";
import type { NextRequest } from "next/server";

import { auth } from "@/shared/server/auth";
import { db } from "@/shared/server/db";
import { logAudit } from "@/shared/server/audit";
import { getClientIp } from "@/shared/server/http/ip";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;

  const measurement = await db.measurement.findFirst({
    where: { id, userId, deletedAt: null },
    include: { biomarker: true, labReport: true },
  });

  if (!measurement) {
    return new Response("Not found", { status: 404 });
  }

  await logAudit({
    action: AuditAction.MEASUREMENT_VIEW,
    userId,
    subject: { type: "Measurement", id: measurement.id },
    request: req,
    ip: getClientIp(req),
  });

  return Response.json(measurement);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;

  const existing = await db.measurement.findFirst({
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
  const deletedAt = body.deletedAt as string | undefined;

  const updated = await db.measurement.update({
    where: { id },
    data: {
      biomarkerId,
      labReportId,
      measuredAt: measuredAt ? new Date(measuredAt) : undefined,
      value,
      comparator:
        comparator && comparator in MeasurementComparator
          ? (comparator as MeasurementComparator)
          : undefined,
      unit,
      referenceLow,
      referenceHigh,
      referenceText,
      flag:
        flag && flag in MeasurementFlag ? (flag as MeasurementFlag) : undefined,
      note,
      // allow explicit soft-delete override if provided, otherwise untouched
      deletedAt: deletedAt ? new Date(deletedAt) : undefined,
      source: MeasurementSource.MANUAL,
    },
  });

  await logAudit({
    action: AuditAction.MEASUREMENT_UPDATE,
    userId,
    subject: { type: "Measurement", id: updated.id },
    metadata: { flag: updated.flag, comparator: updated.comparator },
    request: req,
    ip: getClientIp(req),
  });

  return Response.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;

  const existing = await db.measurement.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!existing) {
    return new Response("Not found", { status: 404 });
  }

  await db.measurement.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await logAudit({
    action: AuditAction.MEASUREMENT_DELETE,
    userId,
    subject: { type: "Measurement", id: existing.id },
    request: req,
    ip: getClientIp(req),
  });

  return new Response(null, { status: 204 });
}
