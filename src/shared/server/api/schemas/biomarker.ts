import { z } from "zod";
import { BiomarkerCategory } from "@prisma/client";

export const biomarkerCategorySchema = z.nativeEnum(BiomarkerCategory);

export const listBiomarkersInputSchema = z.object({
  category: biomarkerCategorySchema.optional(),
  search: z.string().max(100).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().nullish(),
});

export const getBiomarkerInputSchema = z.object({
  idOrSlug: z.string().min(1),
});