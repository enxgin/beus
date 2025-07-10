import { z } from 'zod';

export const CommissionType = z.enum(['PERCENTAGE', 'FIXED_AMOUNT']);
export const CommissionRuleType = z.enum(['GENERAL', 'SERVICE_SPECIFIC', 'STAFF_SPECIFIC']);

export const commissionRuleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Kural adı gereklidir'),
  type: CommissionType,
  rate: z.coerce.number().min(0, 'Oran 0\'dan küçük olamaz').optional(),
  fixedAmount: z.coerce.number().min(0, 'Sabit tutar 0\'dan küçük olamaz').optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  branchId: z.string().optional(),
  // Yeni hiyerarşik sistem alanları
  ruleType: CommissionRuleType.optional(),
  serviceId: z.string().optional().nullable(),
  staffId: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  // Geriye uyumluluk için eski alanlar
  value: z.coerce.number().min(0, 'Değer 0\'dan küçük olamaz').optional(),
  isGlobal: z.boolean().optional(),
  userId: z.string().optional().nullable(),
}).refine((data) => {
  // Type'a göre rate veya fixedAmount'un dolu olması gerekiyor
  if (data.type === 'PERCENTAGE') {
    return data.rate !== undefined && data.rate > 0;
  } else if (data.type === 'FIXED_AMOUNT') {
    return data.fixedAmount !== undefined && data.fixedAmount > 0;
  }
  return true;
}, {
  message: "Prim tipi seçimine göre oran veya sabit tutar belirtilmelidir",
  path: ["rate", "fixedAmount"]
}).refine((data) => {
  // RuleType'a göre ilgili alanların dolu olması gerekiyor
  if (data.ruleType === 'SERVICE_SPECIFIC') {
    return data.serviceId !== undefined && data.serviceId !== null && data.serviceId !== '';
  } else if (data.ruleType === 'STAFF_SPECIFIC') {
    return data.staffId !== undefined && data.staffId !== null && data.staffId !== '';
  }
  return true;
}, {
  message: "Kural tipine göre hizmet veya personel seçimi yapılmalıdır",
  path: ["serviceId", "staffId"]
});

export type CommissionRuleFormValues = z.infer<typeof commissionRuleSchema>;