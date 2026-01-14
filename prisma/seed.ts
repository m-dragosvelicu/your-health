/**
 * STUB: Biomarker seed data - future work
 *
 * Seeds 13 common biomarkers as reference data. Currently not used by the app
 * because there's no linking between LabTest and Biomarker.
 *
 * To make this useful, need to implement:
 * 1. Alias table mapping test name variations to canonical biomarkers
 * 2. Linking logic during PDF parsing or manual user linking
 * 3. Expanded catalog (hundreds of biomarkers exist in real lab reports)
 */

import { PrismaClient, BiomarkerCategory } from "@prisma/client";

const db = new PrismaClient();

type BiomarkerSeed = {
  slug: string;
  name: string;
  category: BiomarkerCategory;
  canonicalUnit: string;
  defaultRefLow?: string;
  defaultRefHigh?: string;
  description?: string;
  sortOrder: number;
};

const BIOMARKERS: BiomarkerSeed[] = [
  {
    slug: "glucose-fasting",
    name: "Glucose (fasting)",
    category: BiomarkerCategory.METABOLIC,
    canonicalUnit: "mg/dL",
    defaultRefLow: "70",
    defaultRefHigh: "99",
    description: "Fasting plasma glucose collected after 8+ hours without food.",
    sortOrder: 10,
  },
  {
    slug: "hba1c",
    name: "HbA1c",
    category: BiomarkerCategory.METABOLIC,
    canonicalUnit: "%",
    defaultRefLow: "4.0",
    defaultRefHigh: "5.6",
    description: "Glycated hemoglobin reflecting average glucose over ~3 months.",
    sortOrder: 20,
  },
  {
    slug: "total-cholesterol",
    name: "Total cholesterol",
    category: BiomarkerCategory.LIPIDS,
    canonicalUnit: "mg/dL",
    defaultRefHigh: "200",
    description: "Sum of LDL, HDL, and VLDL fractions.",
    sortOrder: 30,
  },
  {
    slug: "ldl-cholesterol",
    name: "LDL cholesterol",
    category: BiomarkerCategory.LIPIDS,
    canonicalUnit: "mg/dL",
    defaultRefHigh: "100",
    description: "Low-density lipoprotein cholesterol (atherogenic).",
    sortOrder: 40,
  },
  {
    slug: "hdl-cholesterol",
    name: "HDL cholesterol",
    category: BiomarkerCategory.LIPIDS,
    canonicalUnit: "mg/dL",
    defaultRefLow: "40",
    description: "High-density lipoprotein cholesterol (protective).",
    sortOrder: 50,
  },
  {
    slug: "triglycerides",
    name: "Triglycerides",
    category: BiomarkerCategory.LIPIDS,
    canonicalUnit: "mg/dL",
    defaultRefHigh: "150",
    description: "Circulating triglyceride-rich lipoproteins.",
    sortOrder: 60,
  },
  {
    slug: "tsh",
    name: "TSH",
    category: BiomarkerCategory.THYROID,
    canonicalUnit: "uIU/mL",
    defaultRefLow: "0.4",
    defaultRefHigh: "4.5",
    description: "Thyroid-stimulating hormone.",
    sortOrder: 70,
  },
  {
    slug: "alt",
    name: "ALT",
    category: BiomarkerCategory.LIVER,
    canonicalUnit: "U/L",
    defaultRefLow: "7",
    defaultRefHigh: "55",
    description: "Alanine aminotransferase (liver enzyme).",
    sortOrder: 80,
  },
  {
    slug: "ast",
    name: "AST",
    category: BiomarkerCategory.LIVER,
    canonicalUnit: "U/L",
    defaultRefLow: "8",
    defaultRefHigh: "48",
    description: "Aspartate aminotransferase (liver enzyme).",
    sortOrder: 90,
  },
  {
    slug: "creatinine",
    name: "Creatinine",
    category: BiomarkerCategory.RENAL,
    canonicalUnit: "mg/dL",
    defaultRefLow: "0.6",
    defaultRefHigh: "1.3",
    description: "Kidney filtration marker.",
    sortOrder: 100,
  },
  {
    slug: "bun",
    name: "BUN",
    category: BiomarkerCategory.RENAL,
    canonicalUnit: "mg/dL",
    defaultRefLow: "7",
    defaultRefHigh: "20",
    description: "Blood urea nitrogen.",
    sortOrder: 110,
  },
  {
    slug: "vitamin-d-25-oh",
    name: "Vitamin D 25-OH",
    category: BiomarkerCategory.VITAMINS,
    canonicalUnit: "ng/mL",
    defaultRefLow: "30",
    defaultRefHigh: "100",
    description: "25-hydroxy vitamin D.",
    sortOrder: 120,
  },
  {
    slug: "hs-crp",
    name: "hs-CRP",
    category: BiomarkerCategory.INFLAMMATION,
    canonicalUnit: "mg/L",
    defaultRefLow: "0",
    defaultRefHigh: "3",
    description: "High-sensitivity C-reactive protein.",
    sortOrder: 130,
  },
];

async function main() {
  for (const biomarker of BIOMARKERS) {
    await db.biomarker.upsert({
      where: { slug: biomarker.slug },
      update: {
        name: biomarker.name,
        category: biomarker.category,
        canonicalUnit: biomarker.canonicalUnit,
        defaultRefLow: biomarker.defaultRefLow
          ? { set: biomarker.defaultRefLow }
          : undefined,
        defaultRefHigh: biomarker.defaultRefHigh
          ? { set: biomarker.defaultRefHigh }
          : undefined,
        description: biomarker.description,
        sortOrder: biomarker.sortOrder,
      },
      create: {
        slug: biomarker.slug,
        name: biomarker.name,
        category: biomarker.category,
        canonicalUnit: biomarker.canonicalUnit,
        defaultRefLow: biomarker.defaultRefLow ?? undefined,
        defaultRefHigh: biomarker.defaultRefHigh ?? undefined,
        description: biomarker.description,
        sortOrder: biomarker.sortOrder,
      },
    });
  }
}

main()
  .then(() => {
    console.info(`Seeded ${BIOMARKERS.length} biomarkers.`);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void db.$disconnect();
  });