import { db } from '../db/storage';
import { notifyOrderStatusChanged, notifySupplierNewOrder } from '../socket';
import { BadRequestError, ForbiddenError, NotFoundError } from '../errors/AppError';
import { AcceptOrderInput, CreateOrderInput } from '../validators/order.validator';
import { OrderStatus } from '../types';
import { ORDER_STATUS_TRANSITIONS, ORDER_STATUSES } from '../constants/app.constants';

export class OrderService {
  /**
   * Create new order
   */
  public createOrder(receiverId: string, input: CreateOrderInput) {
    const supplier = db.findSupplierById(input.supplier_id);
    if (!supplier) {
      throw new NotFoundError('Tanlangan ta\'minotchi topilmadi');
    }

    // Validate that all products exist and are active
    for (const item of input.items) {
      const prod = db.findProductById(item.productId);
      if (!prod || prod.supplier_id !== supplier.id) {
        throw new BadRequestError(`Tovar mavjud emas yoki noto'g'ri ta'minotchi: ${item.productId}`);
      }
      if (!prod.is_available) {
        throw new BadRequestError(`"${prod.name}" ayni vaqtda sotuvda mavjud emas`);
      }
    }

    const order = db.createOrder(
      {
        receiver_id: receiverId,
        supplier_id: supplier.id,
        delivery_lat: input.delivery_lat,
        delivery_lng: input.delivery_lng,
        delivery_address: input.delivery_address,
        delivery_time_slot: input.delivery_time_slot,
        notes: input.notes || null,
        total_price: 0, // Calculated dynamically in storage
      },
      input.items
    );

    // Real-time notification
    notifySupplierNewOrder(supplier.id, order);

    return {
      message: 'Buyurtma muvaffaqiyatli rasmiylashtirildi!',
      order,
    };
  }

  /**
   * Get orders for specific receiver
   */
  public getReceiverOrders(receiverId: string) {
    return db.getOrdersByReceiverId(receiverId);
  }

  /**
   * Get orders for specific supplier
   */
  public getSupplierOrders(userId: string) {
    const supplier = db.findSupplierByUserId(userId);
    if (!supplier) {
      throw new NotFoundError('Ta\'minotchi profili topilmadi');
    }
    return db.getOrdersBySupplierId(supplier.id);
  }

  /**
   * Get single order by ID
   */
  public getOrderById(orderId: string) {
    const order = db.findOrderById(orderId);
    if (!order) {
      throw new NotFoundError('Buyurtma topilmadi');
    }
    return order;
  }

  /**
   * Accept order and assign delivery courier details
   */
  public acceptOrder(userId: string, orderId: string, courierInput: AcceptOrderInput) {
    const supplier = db.findSupplierByUserId(userId);
    if (!supplier) {
      throw new ForbiddenError('Ruxsat berilmagan');
    }

    const order = db.findOrderById(orderId);
    if (!order || order.supplier_id !== supplier.id) {
      throw new NotFoundError('Buyurtma topilmadi yoki sizga tegishli emas');
    }

    if (order.status !== ORDER_STATUSES.PENDING) {
      throw new BadRequestError(
        `Faqat kutilayotgan buyurtmani qabul qilish mumkin (Hozirgi holat: ${order.status})`
      );
    }

    db.assignDelivery(order.id, {
      vehicle_model: courierInput.vehicle_model,
      vehicle_plate_number: courierInput.vehicle_plate_number,
      driver_name: courierInput.driver_name,
      driver_phone: courierInput.driver_phone,
    });

    const updatedOrder = db.findOrderById(order.id);
    if (updatedOrder) {
      notifyOrderStatusChanged(updatedOrder);
    }

    return {
      message: 'Buyurtma qabul qilindi va yuk yig\'ilmoqda holatiga o\'tkazildi',
      order: updatedOrder,
    };
  }

  /**
   * Transition order status
   */
  public updateStatus(userId: string, orderId: string, nextStatus: OrderStatus) {
    const supplier = db.findSupplierByUserId(userId);
    if (!supplier) {
      throw new ForbiddenError('Ruxsat berilmagan');
    }

    const order = db.findOrderById(orderId);
    if (!order || order.supplier_id !== supplier.id) {
      throw new NotFoundError('Buyurtma topilmadi');
    }

    const allowedNextStatuses = ORDER_STATUS_TRANSITIONS[order.status] || [];
    if (!allowedNextStatuses.includes(nextStatus)) {
      throw new BadRequestError(`Holatni ${order.status} dan ${nextStatus} ga o'tkazib bo'lmaydi`);
    }

    const updated = db.updateOrderStatus(order.id, nextStatus);
    if (updated) {
      notifyOrderStatusChanged(updated);
    }

    return {
      message: `Buyurtma holati yangilandi: ${nextStatus}`,
      order: updated,
    };
  }

  /**
   * Reject order with mandatory reason
   */
  public rejectOrder(userId: string, orderId: string, reason: string) {
    const supplier = db.findSupplierByUserId(userId);
    if (!supplier) {
      throw new ForbiddenError('Ruxsat berilmagan');
    }

    const order = db.findOrderById(orderId);
    if (!order || order.supplier_id !== supplier.id) {
      throw new NotFoundError('Buyurtma topilmadi');
    }

    const trimmedReason = reason?.trim();
    if (!trimmedReason) {
      throw new BadRequestError('Rad etish sababi kiritilishi majburiy!');
    }

    const updated = db.updateOrderStatus(order.id, ORDER_STATUSES.REJECTED, trimmedReason);
    if (updated) {
      notifyOrderStatusChanged(updated);
    }

    return {
      message: 'Buyurtma rad etildi',
      order: updated,
    };
  }

  /**
   * Cancel order by receiver
   */
  public cancelOrder(receiverId: string, orderId: string, reason?: string) {
    const order = db.findOrderById(orderId);
    if (!order) {
      throw new NotFoundError('Buyurtma topilmadi');
    }

    if (order.receiver_id !== receiverId) {
      throw new ForbiddenError('Ushbu buyurtmani bekor qilish huquqiga ega emassiz');
    }

    if (order.status !== ORDER_STATUSES.PENDING) {
      throw new BadRequestError(
        `Faqat kutilayotgan buyurtmani bekor qilish mumkin. Hozirgi holat: ${order.status}`
      );
    }

    const cancellationReason = reason?.trim() || 'Xaridor tomonidan bekor qilindi';
    const updated = db.updateOrderStatus(order.id, ORDER_STATUSES.REJECTED, cancellationReason);

    if (updated) {
      notifyOrderStatusChanged(updated);
    }

    return {
      message: 'Buyurtma muvaffaqiyatli bekor qilindi',
      order: updated,
    };
  }
}

export const orderService = new OrderService();
