import { z } from 'zod';

export const CommissionType = z.enum(['PERCENTAGE', 'FIXED_AMOUNT']);

export const commissionRuleSchema = z.object({
  id: z.string().optional(),
  type: CommissionType,
  value: z.coerce.number().min(0, 'Değer 0\'dan küçük olamaz'),
  description: z.string().optional(),
  isGlobal: z.boolean().optional(),
  serviceId: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
});

export type CommissionRuleFormValues = z.infer<typeof commissionRuleSchema>;