import { z } from 'zod';

export const CommissionType = z.enum(['PERCENTAGE', 'FIXED_AMOUNT']);

export const commissionRuleSchema = z.object({
  id: z.string().optional(),
  type: CommissionType,
  value: z.coerce.number().min(0, 'Değer 0\'dan küçük olamaz'),
  description: z.string().optional(),
  isGlobal: z.preprocess((val) => val ?? false, z.boolean()),
  serviceId: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
}).refine(data => {
    const { isGlobal, serviceId, userId } = data;
    const conditions = [isGlobal, !!serviceId, !!userId];
    const trueCount = conditions.filter(c => c).length;
    return trueCount === 1;
}, {
    message: 'Kural sadece Genel, Hizmete özel veya Personele özel olabilir. Lütfen sadece birini seçin.',
    path: ['isGlobal'], // you can choose any path to show the error
});

export type CommissionRuleFormValues = z.infer<typeof commissionRuleSchema>;