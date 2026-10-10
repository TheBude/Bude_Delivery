import { z } from 'zod';

export const updateSupplierSettingsSchema = z.object({
  company_name: z.string().min(1, 'Kompaniya nomi bo\'sh bo\'lishi mumkin emas').optional(),
  delivery_fee: z.number().min(0, 'Yetkazib berish narxi manfiy bo\'lishi mumkin emas').optional(),
  is_free_delivery: z.boolean().optional(),
});

export const supplierQuerySchema = z.object({
  q: z.string().optional(),
  free_delivery: z.string().optional(),
});

export type UpdateSupplierSettingsInput = z.infer<typeof updateSupplierSettingsSchema>;
