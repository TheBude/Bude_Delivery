import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthTokenPayload, Order, Product } from '../types';

let ioInstance: SocketIOServer | null = null;

export function setupSocketIO(server: HttpServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // Authentication middleware for socket connections
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    const userId = socket.handshake.auth?.userId;

    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
        (socket as any).user = decoded;
        return next();
      } catch (err) {
        // Fall back to dev/plain userId if allowed
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
    console.log(`[Socket.io] Client connected: ${socket.id}`, user ? `User: ${user.userId} (${user.role})` : 'Anonymous');

    // Join user-specific rooms
    if (user?.userId) {
      socket.join(`user:${user.userId}`);
    }

    // Join supplier specific room
    socket.on('join:supplier', (supplierId: string) => {
      socket.join(`supplier:${supplierId}`);
      console.log(`[Socket.io] Socket ${socket.id} joined room supplier:${supplierId}`);
    });

    // Join receiver specific room
    socket.on('join:receiver', (receiverId: string) => {
      socket.join(`receiver:${receiverId}`);
      console.log(`[Socket.io] Socket ${socket.id} joined room receiver:${receiverId}`);
    });

    // Join single order room for tracking updates
    socket.on('join:order', (orderId: string) => {
      socket.join(`order:${orderId}`);
      console.log(`[Socket.io] Socket ${socket.id} joined room order:${orderId}`);
    });

    socket.on('leave:order', (orderId: string) => {
      socket.leave(`order:${orderId}`);
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

export function notifySupplierNewOrder(supplierId: string, order: Order) {
  if (!ioInstance) return;
  console.log(`[Socket.io] Emitting order:new to supplier:${supplierId}`);
  ioInstance.to(`supplier:${supplierId}`).emit('order:new', {
    order,
    timestamp: new Date().toISOString(),
    message: 'Yangi buyurtma qabul qilindi!',
  });
}

export function notifyOrderStatusChanged(order: Order) {
  if (!ioInstance) return;
  console.log(`[Socket.io] Emitting order:status_updated for order ${order.id} (Status: ${order.status})`);
  
  const payload = {
    order,
    orderId: order.id,
    status: order.status,
    timestamp: new Date().toISOString(),
  };

  // Notify receiver room
  ioInstance.to(`receiver:${order.receiver_id}`).emit('order:status_updated', payload);
  // Notify supplier room
  ioInstance.to(`supplier:${order.supplier_id}`).emit('order:status_updated', payload);
  // Notify specific order room
  ioInstance.to(`order:${order.id}`).emit('order:status_updated', payload);
}

export function notifyProductUpdated(supplierId: string, product: Product) {
  if (!ioInstance) return;
  ioInstance.emit('product:updated', {
    supplierId,
    product,
    timestamp: new Date().toISOString(),
  });
}
