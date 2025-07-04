import { z } from "zod"

// Branch schema
export const branchSchema = z.object({
  id: z.string(),
  name: z.string(),
});

// Tag schema
export const tagSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().optional(),
});

// Customer schema with branch and tags
export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string().nullable().optional(),
  creditBalance: z.number(),
  createdAt: z.string(), // Dates will be strings in JSON
  notes: z.string().nullable().optional(),
  discountRate: z.number().optional().default(0),
  branch: branchSchema.optional(),
  tags: z.array(tagSchema).optional().default([]),
});

export type Branch = z.infer<typeof branchSchema>
export type Tag = z.infer<typeof tagSchema>
export type Customer = z.infer<typeof customerSchema>
