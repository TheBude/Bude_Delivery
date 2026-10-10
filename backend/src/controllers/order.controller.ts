import { Response, NextFunction } from 'express';
import { orderService } from '../services/order.service';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { HTTP_STATUS } from '../constants/http.constants';

export class OrderController {
  public createOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const result = orderService.createOrder(req.user!.userId, req.body);
      res.status(HTTP_STATUS.CREATED).json(result);
    } catch (err) {
      next(err);
    }
  }

  public getReceiverOrders(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const orders = orderService.getReceiverOrders(req.user!.userId);
      res.json(orders);
    } catch (err) {
      next(err);
    }
  }

  public getSupplierOrders(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const orders = orderService.getSupplierOrders(req.user!.userId);
      res.json(orders);
    } catch (err) {
      next(err);
    }
  }

  public getOrderById(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const id = req.params.id as string;
      const order = orderService.getOrderById(id);
      res.json(order);
    } catch (err) {
      next(err);
    }
  }

  public acceptOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const id = req.params.id as string;
      const result = orderService.acceptOrder(req.user!.userId, id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const id = req.params.id as string;
      const result = orderService.updateStatus(req.user!.userId, id, req.body.status);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public rejectOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const id = req.params.id as string;
      const result = orderService.rejectOrder(req.user!.userId, id, req.body.rejection_reason);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public cancelOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const id = req.params.id as string;
      const result = orderService.cancelOrder(req.user!.userId, id, req.body?.cancellation_reason);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const orderController = new OrderController();
