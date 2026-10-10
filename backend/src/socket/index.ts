import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { config } from '../config';
import { verifyToken } from '../utils/jwt';
import { AuthTokenPayload, Order, Product } from '../types';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../constants/app.constants';

import { db } from '../db/storage';

let ioInstance: SocketIOServer | null = null;

export function setupSocketIO(server: HttpServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // Authentication middleware for socket connections
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');
    const userId = socket.handshake.auth?.userId;

    if (token) {
      try {
        const decoded = verifyToken(token);
        (socket as any).user = decoded;
        return next();
      } catch {
        // Fall back to dev/plain userId if available
      }
    }

    if (userId) {
      (socket as any).user = { userId, role: socket.handshake.auth?.role };
      return next();
    }

    // Allow guest / initial socket connections
    return next();
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    console.log(
      `[Socket.io] Client connected: ${socket.id}`,
      user ? `User: ${user.userId} (${user.role})` : 'Anonymous'
    );

    // Join user-specific room
    if (user?.userId) {
      socket.join(SOCKET_ROOMS.user(user.userId));
      try {
        const sup = db.findSupplierByUserId(user.userId);
        if (sup) {
          socket.join(SOCKET_ROOMS.supplier(sup.id));
          console.log(`[Socket.io] Auto-joined supplier room: supplier:${sup.id}`);
        }
      } catch {}
    }

    // Join supplier specific room
    socket.on(SOCKET_EVENTS.JOIN_SUPPLIER, (supplierId: string) => {
      socket.join(SOCKET_ROOMS.supplier(supplierId));
      console.log(`[Socket.io] Socket ${socket.id} joined room supplier:${supplierId}`);
    });

    // Join receiver specific room
    socket.on(SOCKET_EVENTS.JOIN_RECEIVER, (receiverId: string) => {
      socket.join(SOCKET_ROOMS.receiver(receiverId));
      console.log(`[Socket.io] Socket ${socket.id} joined room receiver:${receiverId}`);
    });

    // Join single order room for tracking updates
    socket.on(SOCKET_EVENTS.JOIN_ORDER, (orderId: string) => {
      socket.join(SOCKET_ROOMS.order(orderId));
      console.log(`[Socket.io] Socket ${socket.id} joined room order:${orderId}`);
    });

    socket.on(SOCKET_EVENTS.LEAVE_ORDER, (orderId: string) => {
      socket.leave(SOCKET_ROOMS.order(orderId));
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.io] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  ioInstance = io;
  return io;
}

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

export function notifySupplierNewOrder(supplierId: string, order: Order): void {
  if (!ioInstance) return;
  console.log(`[Socket.io] Emitting order:new to supplier:${supplierId}`);
  const payload = {
    order,
    orderId: order.id,
    supplierId,
    timestamp: new Date().toISOString(),
    message: 'Yangi buyurtma qabul qilindi!',
  };

  // 1. Emit to supplier room
  ioInstance.to(SOCKET_ROOMS.supplier(supplierId)).emit(SOCKET_EVENTS.ORDER_NEW, payload);

  // 2. Emit to supplier user's room
  try {
    const sup = db.findSupplierById(supplierId);
    if (sup) {
      ioInstance.to(SOCKET_ROOMS.user(sup.user_id)).emit(SOCKET_EVENTS.ORDER_NEW, payload);
    }
  } catch {}

  // 3. Emit global broadcast
  ioInstance.emit('order:new_broadcast', payload);
}

export function notifyOrderStatusChanged(order: Order): void {
  if (!ioInstance) return;
  console.log(
    `[Socket.io] Emitting order:status_updated for order ${order.id} (Status: ${order.status})`
  );

  const payload = {
    order,
    orderId: order.id,
    status: order.status,
    timestamp: new Date().toISOString(),
  };

  // Notify receiver room
  ioInstance.to(SOCKET_ROOMS.receiver(order.receiver_id)).emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, payload);
  ioInstance.to(SOCKET_ROOMS.user(order.receiver_id)).emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, payload);

  // Notify supplier room
  ioInstance.to(SOCKET_ROOMS.supplier(order.supplier_id)).emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, payload);
  try {
    const sup = db.findSupplierById(order.supplier_id);
    if (sup) {
      ioInstance.to(SOCKET_ROOMS.user(sup.user_id)).emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, payload);
    }
  } catch {}

  // Notify specific order room
  ioInstance.to(SOCKET_ROOMS.order(order.id)).emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, payload);

  // Global broadcast
  ioInstance.emit('order:status_broadcast', payload);
}

export function notifyProductUpdated(supplierId: string, product: Product): void {
  if (!ioInstance) return;
  ioInstance.emit(SOCKET_EVENTS.PRODUCT_UPDATED, {
    supplierId,
    product,
    timestamp: new Date().toISOString(),
  });
}
