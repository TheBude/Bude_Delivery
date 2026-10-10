import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { HTTP_STATUS } from '../constants/http.constants';

export class ProductController {
  public getProductsBySupplier(req: Request, res: Response, next: NextFunction): void {
    try {
      const supplierId = req.params.supplierId as string;
      const onlyAvailable = req.query.all !== 'true';
      const products = productService.getProductsBySupplier(supplierId, onlyAvailable);
      res.json(products);
    } catch (err) {
      next(err);
    }
  }

  public createProduct(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const result = productService.createProduct(req.user!.userId, req.body);
      res.status(HTTP_STATUS.CREATED).json(result);
    } catch (err) {
      next(err);
    }
  }

  public updateProduct(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const id = req.params.id as string;
      const result = productService.updateProduct(req.user!.userId, id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public toggleAvailability(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const id = req.params.id as string;
      const result = productService.toggleAvailability(req.user!.userId, id, req.body?.is_available);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public deleteProduct(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const id = req.params.id as string;
      const result = productService.deleteProduct(req.user!.userId, id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const productController = new ProductController();
