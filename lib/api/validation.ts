import { z } from "zod";

export const createCollectionSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required.")
    .max(100, "Name must be 100 characters or fewer.")
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      "Name can only contain letters, numbers, spaces, hyphens, and underscores."
    ),
  description: z.string().max(500).optional(),
});

export const updateCollectionSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9\s\-_]+$/)
    .optional(),
  description: z.string().max(500).optional(),
});

export const createRecordSchema = z.object({
  data: z.record(z.string(), z.unknown()),
});

export const updateRecordSchema = z.object({
  data: z.record(z.string(), z.unknown()),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createApiKeySchema = z.object({
  name: z.string().min(1, "Name is required.").max(100),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});
