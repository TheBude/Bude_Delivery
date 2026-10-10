import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/storage';
import { authMiddleware, AuthenticatedRequest, requireRole } from '../middleware/authMiddleware';
import { notifySupplierNewOrder, notifyOrderStatusChanged } from '../socket';
import { OrderStatus } from '../types';

export const orderRouter = Router();

// 1. Create Order (Receiver only)
const createOrderSchema = z.object({
  supplier_id: z.string().min(1, 'Ta\'minotchi tanlanishi shart'),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().min(1).default(1),
    })
  ).min(1, 'Savatda kamida bitta tovar bo\'lishi kerak'),
  delivery_lat: z.number(),
  delivery_lng: z.number(),
  delivery_address: z.string().min(1, 'Yetkazish manzili ko\'rsatilishi shart'),
  delivery_time_slot: z.string().min(1, 'Yetkazib berish vaqt oralig\'i tanlanishi shart'),
  notes: z.string().optional().nullable(),
});

orderRouter.post(
  '/',
  authMiddleware,
  requireRole(['RECEIVER', 'SUPPLIER']), // Allow any authenticated user to place test order
  (req: AuthenticatedRequest, res: Response): void => {
    const result = createOrderSchema.safeParse(req.body);

  if (!result.success) {
    const errorMsg = (result.error as any).issues?.[0]?.message || result.error.message || 'Buyurtma ma\'lumotlarida xatolik';
    res.status(400).json({ error: errorMsg });
    return;
  }

    const data = result.data;
    const supplier = db.findSupplierById(data.supplier_id);

    if (!supplier) {
      res.status(404).json({ error: 'Tanlangan ta\'minotchi topilmadi' });
      return;
    }

    // Verify products exist and belong to supplier
    for (const item of data.items) {
      const prod = db.findProductById(item.productId);
      if (!prod || prod.supplier_id !== supplier.id) {
        res.status(400).json({ error: `Tovar mavjud emas yoki noto'g'ri ta'minotchi: ${item.productId}` });
        return;
      }
      if (!prod.is_available) {
        res.status(400).json({ error: `"${prod.name}" ayni vaqtda sotuvda mavjud emas` });
        return;
      }
    }

    const order = db.createOrder(
      {
        receiver_id: req.user!.userId,
        supplier_id: supplier.id,
        delivery_lat: data.delivery_lat,
        delivery_lng: data.delivery_lng,
        delivery_address: data.delivery_address,
        delivery_time_slot: data.delivery_time_slot,
        notes: data.notes || null,
        total_price: 0, // Calculated dynamically in db.createOrder
      },
      data.items
    );

    // Emit real-time notification to supplier
    notifySupplierNewOrder(supplier.id, order);

    res.status(201).json({
      message: 'Buyurtma muvaffaqiyatli rasmiylashtirildi!',
      order,
    });
  }
);

// 2. Get Orders for Current Receiver
orderRouter.get(
  '/receiver',
  authMiddleware,
  (req: AuthenticatedRequest, res: Response): void => {
    const orders = db.getOrdersByReceiverId(req.user!.userId);
    res.json(orders);
  }
);

// 3. Get Orders for Current Supplier
orderRouter.get(
  '/supplier',
  authMiddleware,
  requireRole(['SUPPLIER']),
  (req: AuthenticatedRequest, res: Response): void => {
    const supplier = db.findSupplierByUserId(req.user!.userId);

    if (!supplier) {
      res.status(404).json({ error: 'Ta\'minotchi profili topilmadi' });
      return;
    }

    const orders = db.getOrdersBySupplierId(supplier.id);
    res.json(orders);
  }
);

// 4. Get Single Order Details
orderRouter.get(
  '/:id',
  authMiddleware,
  (req: AuthenticatedRequest, res: Response): void => {
    const id = req.params.id as string;
    const order = db.findOrderById(id);

    if (!order) {
      res.status(404).json({ error: 'Buyurtma topilmadi' });
      return;
    }

    res.json(order);
  }
);

// 5. Accept Order with Transport/Driver info (Supplier only)
const acceptOrderSchema = z.object({
  vehicle_model: z.string().min(1, 'Avtomobil rusumi kiritilishi shart'),
  vehicle_plate_number: z.string().min(1, 'Davlat raqami kiritilishi shart'),
  driver_name: z.string().min(1, 'Haydovchi ismi kiritilishi shart'),
  driver_phone: z.string().min(7, 'Haydovchi telefon raqami kiritilishi shart'),
});

orderRouter.post(
  '/:id/accept',
  authMiddleware,
  requireRole(['SUPPLIER']),
  (req: AuthenticatedRequest, res: Response): void => {
    const id = req.params.id as string;
    const supplier = db.findSupplierByUserId(req.user!.userId);

    if (!supplier) {
      res.status(403).json({ error: 'Ruxsat berilmagan' });
      return;
    }

    const order = db.findOrderById(id);
    if (!order || order.supplier_id !== supplier.id) {
      res.status(404).json({ error: 'Buyurtma topilmadi yoki sizga tegishli emas' });
      return;
    }

    if (order.status !== 'PENDING') {
      res.status(400).json({ error: `Faqat kutilayotgan buyurtmani qabul qilish mumkin (Hozirgi holat: ${order.status})` });
      return;
    }

    const result = acceptOrderSchema.safeParse(req.body);
    if (!result.success) {
      const errorMsg = (result.error as any).issues?.[0]?.message || result.error.message || 'Transport ma\'lumotlarida xatolik';
      res.status(400).json({ error: errorMsg });
      return;
    }

    const data = result.data;

    // Assign delivery details and update status to PREPARING
    db.assignDelivery(order.id, {
      vehicle_model: data.vehicle_model,
      vehicle_plate_number: data.vehicle_plate_number,
      driver_name: data.driver_name,
      driver_phone: data.driver_phone,
    });

    const updatedOrder = db.findOrderById(order.id);

    if (updatedOrder) {
      notifyOrderStatusChanged(updatedOrder);
    }

    res.json({
      message: 'Buyurtma qabul qilindi va yuk yig\'ilmoqda holatiga o\'tkazildi',
      order: updatedOrder,
    });
  }
);

// 6. Update Order Status ("Yuk yig'ilmoqda" -> "Yo'lga chiqdi" -> "Yetkazildi")
orderRouter.post(
  '/:id/status',
  authMiddleware,
  requireRole(['SUPPLIER']),
  (req: AuthenticatedRequest, res: Response): void => {
    const id = req.params.id as string;
    const { status } = req.body;
    const supplier = db.findSupplierByUserId(req.user!.userId);

    if (!supplier) {
      res.status(403).json({ error: 'Ruxsat berilmagan' });
      return;
    }

    const order = db.findOrderById(id);
    if (!order || order.supplier_id !== supplier.id) {
      res.status(404).json({ error: 'Buyurtma topilmadi' });
      return;
    }

    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: ['PREPARING', 'REJECTED'],
      PREPARING: ['IN_TRANSIT', 'REJECTED'],
      IN_TRANSIT: ['DELIVERED', 'REJECTED'],
      DELIVERED: [],
      REJECTED: [],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      res.status(400).json({
        error: `Holatni ${order.status} dan ${status} ga o'tkazib bo'lmaydi`,
      });
      return;
    }

    const updated = db.updateOrderStatus(order.id, status as OrderStatus);

    if (updated) {
      notifyOrderStatusChanged(updated);
    }

    res.json({
      message: `Buyurtma holati yangilandi: ${status}`,
      order: updated,
    });
  }
);

// 7. Reject Order (Mandatory reason)
orderRouter.post(
  '/:id/reject',
  authMiddleware,
  requireRole(['SUPPLIER']),
  (req: AuthenticatedRequest, res: Response): void => {
    const id = req.params.id as string;
    const { rejection_reason } = req.body;
    const supplier = db.findSupplierByUserId(req.user!.userId);

    if (!supplier) {
      res.status(403).json({ error: 'Ruxsat berilmagan' });
      return;
    }

    const order = db.findOrderById(id);
    if (!order || order.supplier_id !== supplier.id) {
      res.status(404).json({ error: 'Buyurtma topilmadi' });
      return;
    }

    if (!rejection_reason || !rejection_reason.trim()) {
      res.status(400).json({ error: 'Rad etish sababi kiritilishi majburiy!' });
      return;
    }

    const updated = db.updateOrderStatus(order.id, 'REJECTED', rejection_reason.trim());

    if (updated) {
      notifyOrderStatusChanged(updated);
    }

    res.json({
      message: 'Buyurtma rad etildi',
      order: updated,
    });
  }
);

// 8. Cancel Order (Receiver only, while status is PENDING)
orderRouter.post(
  '/:id/cancel',
  authMiddleware,
  (req: AuthenticatedRequest, res: Response): void => {
    const id = req.params.id as string;
    const { cancellation_reason } = req.body;
    const order = db.findOrderById(id);

    if (!order) {
      res.status(404).json({ error: 'Buyurtma topilmadi' });
      return;
    }

    if (order.receiver_id !== req.user!.userId) {
      res.status(403).json({ error: 'Ushbu buyurtmani bekor qilish huquqiga ega emassiz' });
      return;
    }

    if (order.status !== 'PENDING') {
      res.status(400).json({
        error: `Faqat kutilayotgan buyurtmani bekor qilish mumkin. Hozirgi holat: ${order.status}`,
      });
      return;
    }

    const reason = cancellation_reason?.trim() || 'Xaridor tomonidan bekor qilindi';
    const updated = db.updateOrderStatus(order.id, 'REJECTED', reason);

    if (updated) {
      notifyOrderStatusChanged(updated);
    }

    res.json({
      message: 'Buyurtma muvaffaqiyatli bekor qilindi',
      order: updated,
    });
  }
);

