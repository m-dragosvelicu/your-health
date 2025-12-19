import "server-only";

import { db } from "@/shared/server/db";
import type { ParsedLab } from "./parse-synevo";

type SaveLabArgs = {
  userId: string;
  provider: string;
  parsed: ParsedLab;
  rawFilePath?: string | null;
};

export async function saveParsedLab({
  userId,
  provider,
  parsed,
  rawFilePath,
}: SaveLabArgs) {
  const lab = await db.lab.create({
    data: {
      userId,
      provider,
      patientLastName: parsed.patient.lastName,
      patientFirstName: parsed.patient.firstName,
      patientBirthdate: parsed.patient.birthdate,
      sampledAt: parsed.meta.sampledAt,
      resultAt: parsed.meta.resultAt,
      rawFilePath: rawFilePath ?? null,
      tests: {
        create: parsed.tests.map((test) => ({
          section: test.section,
          name: test.name,
          value: test.value,
          rawValue: test.rawValue,
          unit: test.unit,
          refRaw: test.refRaw,
          isEdited: "isEdited" in test ? Boolean(test.isEdited) : false,
        })),
      },
    },
    include: {
      tests: true,
    },
  });

  return lab;
}

