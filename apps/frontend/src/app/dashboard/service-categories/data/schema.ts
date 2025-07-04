import { z } from "zod"

// Branch (Şube) schema referansı
export const branchSchema = z.object({
  id: z.string(),
  name: z.string(),
})

type Branch = z.infer<typeof branchSchema>

// Hizmet kategorisi şeması
export const serviceCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, { message: "Kategori adı zorunludur" }),
  description: z.string().optional().nullable(),
  branchId: z.string().optional().nullable(),
  branch: branchSchema.optional().nullable(),
  isActive: z.boolean().default(true),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
})

export type ServiceCategory = z.infer<typeof serviceCategorySchema>
