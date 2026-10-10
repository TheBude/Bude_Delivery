import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Tovar nomi kiritilishi shart'),
  description: z.string().optional().nullable(),
  price: z.number().min(0, 'Narx manfiy bo\'lishi mumkin emas'),
  discount_price: z.number().min(0).optional().nullable(),
  is_available: z.boolean().default(true),
  quantity_optional: z.number().int().min(0).optional().nullable(),
  image_url: z.string().optional().nullable(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Tovar nomi bo\'sh bo\'lishi mumkin emas').optional(),
  description: z.string().nullable().optional(),
  price: z.number().min(0, 'Narx manfiy bo\'lishi mumkin emas').optional(),
  discount_price: z.number().min(0).nullable().optional(),
  is_available: z.boolean().optional(),
  quantity_optional: z.number().int().min(0).nullable().optional(),
  image_url: z.string().nullable().optional(),
});

export const toggleProductAvailabilitySchema = z.object({
  is_available: z.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
