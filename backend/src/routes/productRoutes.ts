import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { authMiddleware, requireRole } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import {
  createProductSchema,
  toggleProductAvailabilitySchema,
  updateProductSchema,
} from '../validators/product.validator';
import { ROLES } from '../constants/app.constants';

export const productRouter = Router();

// 1. Get products for a supplier
productRouter.get('/supplier/:supplierId', productController.getProductsBySupplier);

// 2. Add New Product (Supplier only)
productRouter.post(
  '/',
  authMiddleware,
  requireRole([ROLES.SUPPLIER]),
  validate(createProductSchema),
  productController.createProduct
);

// 3. Update Existing Product (Supplier only)
productRouter.put(
  '/:id',
  authMiddleware,
  requireRole([ROLES.SUPPLIER]),
  validate(updateProductSchema),
  productController.updateProduct
);

// 4. Toggle Product Availability (Supplier only)
productRouter.patch(
  '/:id/availability',
  authMiddleware,
  requireRole([ROLES.SUPPLIER]),
  validate(toggleProductAvailabilitySchema),
  productController.toggleAvailability
);

// 5. Delete Product (Supplier only)
productRouter.delete(
  '/:id',
  authMiddleware,
  requireRole([ROLES.SUPPLIER]),
  productController.deleteProduct
);
