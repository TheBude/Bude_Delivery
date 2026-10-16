import { Request, Response, NextFunction } from 'express';
import { supplierService } from '../services/supplier.service';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class SupplierController {
  public getAllSuppliers(req: Request, res: Response, next: NextFunction): void {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : undefined;
      const freeDelivery = req.query.free_delivery === 'true';

      const results = supplierService.getAllSuppliers(q, freeDelivery);
      res.setHeader('Cache-Control', 'public, max-age=10, stale-while-revalidate=30');
      res.json(results);
    } catch (err) {
      next(err);
    }
  }

  public getSupplierById(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = req.params.id as string;
      const supplier = supplierService.getSupplierById(id);
      res.setHeader('Cache-Control', 'public, max-age=10, stale-while-revalidate=30');
      res.json(supplier);
    } catch (err) {
      next(err);
    }
  }

  public updateSettings(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const result = supplierService.updateSettings(req.user!.userId, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const supplierController = new SupplierController();
