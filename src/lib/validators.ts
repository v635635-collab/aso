import { z } from 'zod';

const nullish = (v: unknown) => (v == null || v === '' ? undefined : v);

export const paginationSchema = z.object({
  page: z.preprocess(nullish, z.coerce.number().min(1).default(1)),
  limit: z.preprocess(nullish, z.coerce.number().min(1).max(100).default(20)),
});

export const idSchema = z.object({
  id: z.string().min(1),
});

export const searchSchema = z.object({
  search: z.preprocess(nullish, z.string().default('')),
  tags: z.preprocess(nullish, z.string().default('').transform(v => v ? v.split(',').filter(Boolean) : [])),
  sortBy: z.preprocess(nullish, z.string().optional()),
  sortOrder: z.preprocess(nullish, z.enum(['asc', 'desc']).default('desc')),
});
