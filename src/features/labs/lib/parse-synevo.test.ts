import { describe, expect, it } from "vitest";

import { parseSynevo } from "./parse-synevo";

describe("parseSynevo", () => {
  it("parses patient metadata and basic sections from Synevo-style text", () => {
    const text = [
      "Last name: Velicu",
      "First name: Mihail Dragos",
      "Birthdate: 07/07/2004",
      "Sampling date: 19/11/2025 08:12",
      "Result date: 20/11/2025",
      "",
      "Biochemistry",
      "Alanine Aminotransferase (GPT/ALAT/ALT)      67        U/L     < 50",
      "",
      "Immunochemistry",
      "Anti-Thyroglobulin Antibody                  > 4000    IU/mL   < 115",
    ].join("\n");

    const result = parseSynevo(text);

    expect(result.patient).toEqual({
      last_name: "Velicu",
      first_name: "Mihail Dragos",
      birthdate: "2004-07-07",
    });

    expect(result.meta).toEqual({
      provider: "Synevo",
      sampling_date: "2025-11-19",
      result_date: "2025-11-20",
    });

    expect(result.tests).toEqual([
      {
        section: "Biochemistry",
        name: "Alanine Aminotransferase (GPT/ALAT/ALT)",
        value: 67,
        raw_value: "67",
        unit: "U/L",
        ref_raw: "< 50",
      },
      {
        section: "Immunochemistry",
        name: "Anti-Thyroglobulin Antibody",
        value: null,
        raw_value: "> 4000",
        unit: "IU/mL",
        ref_raw: "< 115",
      },
    ]);
  });

  it("ignores method sub-lines and rows without a valid unit", () => {
    const text = [
      "Biochemistry",
      "Ser / Kinetic method",
      "Direct Bilirubin                             0.306     mg/dL   ≤ 0.3",
      "Some weird row without numbers or units",
    ].join("\n");

    const result = parseSynevo(text);

    expect(result.tests).toEqual([
      {
        section: "Biochemistry",
        name: "Direct Bilirubin",
        value: 0.306,
        raw_value: "0.306",
        unit: "mg/dL",
        ref_raw: "≤ 0.3",
      },
    ]);
  });

  it("drops obviously invalid rows (very short names) after parsing", () => {
    const text = [
      "Biochemistry",
      "Na                                      135       mmol/L    135 - 145",
    ].join("\n");

    const result = parseSynevo(text);

    expect(result.tests).toEqual([]);
  });
});

