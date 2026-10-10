import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { config } from '../config';
import { verifyToken } from '../utils/jwt';
import { AuthTokenPayload, Order, Product } from '../types';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../constants/app.constants';

let ioInstance: SocketIOServer | null = null;

export function setupSocketIO(server: HttpServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
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
  ioInstance.to(SOCKET_ROOMS.supplier(supplierId)).emit(SOCKET_EVENTS.ORDER_NEW, {
    order,
    timestamp: new Date().toISOString(),
    message: 'Yangi buyurtma qabul qilindi!',
  });
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
  // Notify supplier room
  ioInstance.to(SOCKET_ROOMS.supplier(order.supplier_id)).emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, payload);
  // Notify specific order room
  ioInstance.to(SOCKET_ROOMS.order(order.id)).emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, payload);
}

export function notifyProductUpdated(supplierId: string, product: Product): void {
  if (!ioInstance) return;
  ioInstance.emit(SOCKET_EVENTS.PRODUCT_UPDATED, {
    supplierId,
    product,
    timestamp: new Date().toISOString(),
  });
}
