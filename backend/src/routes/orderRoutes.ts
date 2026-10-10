import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { authMiddleware, requireRole } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import {
  acceptOrderSchema,
  cancelOrderSchema,
  createOrderSchema,
  rejectOrderSchema,
  updateOrderStatusSchema,
} from '../validators/order.validator';
import { ROLES } from '../constants/app.constants';

export const orderRouter = Router();

// 1. Create Order (Receiver or test Supplier)
orderRouter.post(
  '/',
  authMiddleware,
  requireRole([ROLES.RECEIVER, ROLES.SUPPLIER]),
  validate(createOrderSchema),
  orderController.createOrder
);

// 2. Get Orders for Current Receiver
orderRouter.get('/receiver', authMiddleware, orderController.getReceiverOrders);

// 3. Get Orders for Current Supplier
orderRouter.get(
  '/supplier',
  authMiddleware,
  requireRole([ROLES.SUPPLIER]),
  orderController.getSupplierOrders
);

// 4. Get Single Order Details
orderRouter.get('/:id', authMiddleware, orderController.getOrderById);

// 5. Accept Order with Transport / Courier details (Supplier only)
orderRouter.post(
  '/:id/accept',
  authMiddleware,
  requireRole([ROLES.SUPPLIER]),
  validate(acceptOrderSchema),
  orderController.acceptOrder
);

// 6. Update Order Status (Supplier only)
orderRouter.post(
  '/:id/status',
  authMiddleware,
  requireRole([ROLES.SUPPLIER]),
  validate(updateOrderStatusSchema),
  orderController.updateStatus
);

// 7. Reject Order (Supplier only)
orderRouter.post(
  '/:id/reject',
  authMiddleware,
  requireRole([ROLES.SUPPLIER]),
  validate(rejectOrderSchema),
  orderController.rejectOrder
);

// 8. Cancel Order (Receiver only, while PENDING)
orderRouter.post(
  '/:id/cancel',
  authMiddleware,
  validate(cancelOrderSchema),
  orderController.cancelOrder
);
