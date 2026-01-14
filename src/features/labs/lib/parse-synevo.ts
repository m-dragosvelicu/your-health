import "server-only";

import type pdfParseModule from "pdf-parse";

export type ParsedLabPatient = {
  lastName: string | null;
  firstName: string | null;
  birthdate: Date | null;
};

export type ParsedLabMeta = {
  provider: string | null;
  sampledAt: Date | null;
  resultAt: Date | null;
};

export type ParsedLabTest = {
  section: string | null;
  name: string;
  value: number | null;
  rawValue: string;
  unit: string | null;
  refRaw: string | null;
};

export type ParsedLab = {
  patient: ParsedLabPatient;
  meta: ParsedLabMeta;
  tests: ParsedLabTest[];
  rejectedLines: string[];
};

type PdfParseResult = {
  text: string;
  numpages: number;
  info?: Record<string, unknown>;
};

async function loadPdfParse(): Promise<(data: Buffer) => Promise<PdfParseResult>> {
  // Dynamic import keeps the dependency server-only and avoids bundling issues.
  const mod = (await import("pdf-parse")) as typeof pdfParseModule & {
    default: typeof pdfParseModule;
  };
  const fn = (mod.default ?? (mod as unknown as typeof pdfParseModule)) as unknown;
  return fn as (data: Buffer) => Promise<PdfParseResult>;
}

export async function parseSynevoPdf(buffer: Buffer): Promise<ParsedLab> {
  const pdfParse = await loadPdfParse();
  const result = await pdfParse(buffer);

  return parseSynevoText(result.text);
}

export function parseSynevo(text: string): ParsedLab {
  return parseSynevoText(text);
}

export function parseSynevoText(text: string): ParsedLab {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const { patient, meta } = extractHeader(lines);
  const { tests, rejectedLines } = extractTests(lines);

  return {
    patient,
    meta,
    tests,
    rejectedLines,
  };
}

function extractHeader(lines: string[]): {
  patient: ParsedLabPatient;
  meta: ParsedLabMeta;
} {
  let lastName: string | null = null;
  let firstName: string | null = null;
  let birthdate: Date | null = null;
  let sampledAt: Date | null = null;
  let resultAt: Date | null = null;

  for (const line of lines) {
    if (!lastName) {
      const m = /Last name:\s*(.+)$/i.exec(line);
      if (m) lastName = m[1]?.trim() ?? null;
    }
    if (!firstName) {
      const m = /First name:\s*(.+)$/i.exec(line);
      if (m) firstName = m[1]?.trim() ?? null;
    }
    if (!birthdate) {
      const m = /Birthdate:\s*([0-9./-]+)/i.exec(line);
      if (m?.[1]) birthdate = parseSynevoDate(m[1]);
    }
    if (!sampledAt) {
      const m = /Sampling date:\s*([0-9./-]+\s+[0-9:]+)/i.exec(line);
      if (m?.[1]) sampledAt = parseSynevoDateTime(m[1]);
    }
    if (!resultAt) {
      const m =
        /Result date:\s*([0-9./-]+(?:\s+[0-9:]+)?)/i.exec(line) ??
        /Result date:\s*([0-9./-]+)/i.exec(line);
      if (m?.[1]) resultAt = parseSynevoDateTime(m[1]);
    }
  }

  return {
    patient: {
      lastName,
      firstName,
      birthdate,
    },
    meta: {
      provider: "Synevo",
      sampledAt,
      resultAt,
    },
  };
}

function extractTests(lines: string[]): {
  tests: ParsedLabTest[];
  rejectedLines: string[];
} {
  const tests: ParsedLabTest[] = [];
  const rejectedLines: string[] = [];

  const sectionNames = ["Biochemistry", "Immunochemistry", "Hematology"];
  let currentSection: string | null = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+/g, " ").trim();
    if (!line) continue;

    // Section detection
    const matchedSection = sectionNames.find((name) =>
      line.toLowerCase().startsWith(name.toLowerCase()),
    );
    if (matchedSection) {
      currentSection = matchedSection;
      continue;
    }

    if (!currentSection) {
      continue;
    }

    // Skip header row above the table.
    if (/^Name\b/i.test(line) && /Result/i.test(line) && /Reference/i.test(line)) {
      continue;
    }

    // Skip method-only lines (no numeric content or inequality).
    if (!/[0-9><]/.test(line)) {
      continue;
    }

    const parsed = parseTestRow(line, currentSection);
    if (parsed) {
      tests.push(parsed);
    } else {
      rejectedLines.push(line);
    }
  }

  return { tests, rejectedLines };
}

function parseTestRow(line: string, section: string): ParsedLabTest | null {
  // Example shapes:
  //   LC Alanine Aminotransferase (GPT/ALAT/ALT)  67   U/L    < 50
  //   Free T3 ( FT3 )                             4.4  pmol/L 3.1 - 6.8
  //   Anti-Thyroglobulin Antibody                 > 4000 IU/mL < 115
  const cleaned = line.replace(/\s+/g, " ").trim();

  const valueMatch = cleaned.match(/([<>]=?\s*)?(\d+(?:[.,]\d+)?)/);
  if (!valueMatch || valueMatch.index === undefined || !valueMatch[2]) {
    return null;
  }
  const valueText = valueMatch[2];

  const prefix = cleaned.slice(0, valueMatch.index).trim();
  if (prefix.length < 3) {
    return null;
  }

  // Drop technical prefixes like "LC" if present.
  const name = prefix.replace(/^LC\s+/i, "").trim();

  const rawValue = `${valueMatch[1] ?? ""}${valueText}`.trim();
  let numericValue: number | null = null;

  if (!rawValue.startsWith("<") && !rawValue.startsWith(">")) {
    const asNumber = Number.parseFloat(valueText.replace(",", "."));
    if (!Number.isNaN(asNumber)) {
      numericValue = asNumber;
    }
  }

  const rest = cleaned.slice(valueMatch.index + rawValue.length).trim();
  if (!rest) {
    return {
      section,
      name,
      value: numericValue,
      rawValue,
      unit: null,
      refRaw: null,
    };
  }

  const parts = rest.split(" ");
  const unitTokens: string[] = [];
  let idx = 0;

  while (idx < parts.length) {
    const token = parts[idx];
    if (!token) {
      idx += 1;
      continue;
    }
    // A new numeric or inequality token likely indicates the reference range.
    if (/[0-9]/.test(token) || /[<>]/.test(token)) {
      break;
    }
    if (isLikelyUnit(token)) {
      unitTokens.push(token);
      idx += 1;
    } else {
      break;
    }
  }

  const unit = unitTokens.length > 0 ? unitTokens.join(" ") : null;
  const refRawText = parts.slice(idx).join(" ").trim();
  const refRaw = refRawText.length > 0 ? refRawText : null;

  // Very short names or missing units are likely false positives.
  if (!unit) {
    return null;
  }

  return {
    section,
    name,
    value: numericValue,
    rawValue,
    unit,
    refRaw,
  };
}

function isLikelyUnit(token: string): boolean {
  // Simple heuristic: units are alphabetic with optional slashes or percent signs, but no digits.
  if (!token) return false;
  if (/[0-9]/.test(token)) return false;
  return /^[a-zA-Zµ/%]+$/.test(token);
}

function parseSynevoDate(value: string): Date | null {
  const trimmed = value.trim();
  const m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(trimmed);
  if (!m?.[1] || !m[2] || !m[3]) return null;
  const day = Number.parseInt(m[1], 10);
  const month = Number.parseInt(m[2], 10);
  const year = Number.parseInt(m[3], 10);

  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return null;
  }

  // Interpret as local time at midnight.
  return new Date(year, month - 1, day);
}

function parseSynevoDateTime(value: string): Date | null {
  const trimmed = value.trim();
  const m =
    /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/.exec(trimmed);
  if (!m?.[1] || !m[2] || !m[3]) return parseSynevoDate(trimmed);

  const day = Number.parseInt(m[1], 10);
  const month = Number.parseInt(m[2], 10);
  const year = Number.parseInt(m[3], 10);
  const hours = m[4] ? Number.parseInt(m[4], 10) : 0;
  const minutes = m[5] ? Number.parseInt(m[5], 10) : 0;

  if (
    !Number.isFinite(day) ||
    !Number.isFinite(month) ||
    !Number.isFinite(year) ||
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return null;
  }

  return new Date(year, month - 1, day, hours, minutes);
}
