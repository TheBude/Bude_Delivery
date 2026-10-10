import { z } from 'zod';
import { ORDER_STATUSES, ROLES } from '../constants/app.constants';

export const createOrderSchema = z.object({
  supplier_id: z.string().min(1, 'Ta\'minotchi tanlanishi shart'),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'Tovar identifikatori majburiy'),
        quantity: z.number().int().min(1, 'Miqdor kamida 1 bo\'lishi kerak').default(1),
      })
    )
    .min(1, 'Savatda kamida bitta tovar bo\'lishi kerak'),
  delivery_lat: z.number(),
  delivery_lng: z.number(),
  delivery_address: z.string().min(1, 'Yetkazish manzili ko\'rsatilishi shart'),
  delivery_time_slot: z.string().min(1, 'Yetkazib berish vaqt oralig\'i tanlanishi shart'),
  notes: z.string().optional().nullable(),
});

export const acceptOrderSchema = z.object({
  vehicle_model: z.string().min(1, 'Avtomobil rusumi kiritilishi shart'),
  vehicle_plate_number: z.string().min(1, 'Davlat raqami kiritilishi shart'),
  driver_name: z.string().min(1, 'Haydovchi ismi kiritilishi shart'),
  driver_phone: z.string().min(7, 'Haydovchi telefon raqami kiritilishi shart'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    ORDER_STATUSES.PENDING,
    ORDER_STATUSES.PREPARING,
    ORDER_STATUSES.IN_TRANSIT,
    ORDER_STATUSES.DELIVERED,
    ORDER_STATUSES.REJECTED,
  ]),
});

export const rejectOrderSchema = z.object({
  rejection_reason: z.string().min(1, 'Rad etish sababi kiritilishi majburiy!'),
});

export const cancelOrderSchema = z.object({
  cancellation_reason: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type AcceptOrderInput = z.infer<typeof acceptOrderSchema>;
